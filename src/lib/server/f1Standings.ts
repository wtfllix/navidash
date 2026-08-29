import { z } from 'zod';
import { F1_SEASON } from '@/lib/f1Schedule';
import { F1StandingsResponse, F1StandingsResponseSchema } from '@/lib/f1Standings';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_RETRY_MS = 60 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 512 * 1024;

const upstreamStandingSchema = z
  .object({
    position: z.string().regex(/^\d+$/),
    points: z.string().regex(/^\d+(?:\.\d+)?$/),
    wins: z.string().regex(/^\d+$/),
    Driver: z
      .object({
        code: z.string().min(1).max(3),
        givenName: z.string().min(1).max(80),
        familyName: z.string().min(1).max(80),
      })
      .passthrough(),
    Constructors: z
      .array(z.object({ name: z.string().min(1).max(100) }).passthrough())
      .min(1)
      .max(4),
  })
  .passthrough();

const jolpicaResponseSchema = z
  .object({
    MRData: z
      .object({
        StandingsTable: z
          .object({
            season: z.string().regex(/^\d{4}$/),
            round: z.string().regex(/^\d+$/),
            StandingsLists: z
              .array(
                z
                  .object({ DriverStandings: z.array(upstreamStandingSchema).max(30) })
                  .passthrough()
              )
              .max(1),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

let memoryCache: { data: F1StandingsResponse; expiresAt: number } | null = null;
let inFlightRequest: Promise<F1StandingsResponse> | null = null;

async function requestJolpicaStandings(): Promise<F1StandingsResponse> {
  const response = await fetch(
    `${JOLPICA_BASE_URL}/${F1_SEASON.season}/driverstandings.json?limit=30`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NaviDash/0.8.0',
      },
      next: { revalidate: CACHE_TTL_MS / 1000 },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    }
  );

  if (!response.ok) throw new Error(`Jolpica HTTP ${response.status}`);

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_RESPONSE_BYTES) throw new Error('Jolpica response too large');

  const body = await response.text();
  if (body.length > MAX_RESPONSE_BYTES) throw new Error('Jolpica response too large');

  const parsed = jolpicaResponseSchema.parse(JSON.parse(body));
  const table = parsed.MRData.StandingsTable;
  const standings = table.StandingsLists[0]?.DriverStandings ?? [];
  if (standings.length === 0) throw new Error('Jolpica standings unavailable');

  return F1StandingsResponseSchema.parse({
    season: Number(table.season),
    round: Number(table.round),
    standings: standings.map((standing) => ({
      position: Number(standing.position),
      code: standing.Driver.code,
      givenName: standing.Driver.givenName,
      familyName: standing.Driver.familyName,
      constructor: standing.Constructors.at(-1)?.name,
      points: Number(standing.points),
      wins: Number(standing.wins),
    })),
    updatedAt: new Date().toISOString(),
    stale: false,
  });
}

export async function getF1DriverStandings(now = Date.now()) {
  if (memoryCache && memoryCache.expiresAt > now) return memoryCache.data;

  try {
    inFlightRequest ??= requestJolpicaStandings().finally(() => {
      inFlightRequest = null;
    });
    const data = await inFlightRequest;
    memoryCache = { data, expiresAt: now + CACHE_TTL_MS };
    return data;
  } catch (error) {
    if (memoryCache) {
      const data = { ...memoryCache.data, stale: true };
      memoryCache = { data, expiresAt: now + STALE_RETRY_MS };
      return data;
    }
    throw error;
  }
}

export function resetF1StandingsCacheForTests() {
  memoryCache = null;
  inFlightRequest = null;
}
