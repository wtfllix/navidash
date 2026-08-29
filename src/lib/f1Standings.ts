import { z } from 'zod';

export const F1DriverStandingSchema = z
  .object({
    position: z.number().int().positive(),
    code: z.string().min(1).max(3),
    givenName: z.string().min(1).max(80),
    familyName: z.string().min(1).max(80),
    constructor: z.string().min(1).max(100),
    points: z.number().finite().nonnegative(),
    wins: z.number().int().nonnegative(),
  })
  .strict();

export const F1StandingsResponseSchema = z
  .object({
    season: z.number().int().positive(),
    round: z.number().int().nonnegative(),
    standings: z.array(F1DriverStandingSchema).max(30),
    updatedAt: z.string().datetime(),
    stale: z.boolean(),
  })
  .strict();

export type F1DriverStanding = z.infer<typeof F1DriverStandingSchema>;
export type F1StandingsResponse = z.infer<typeof F1StandingsResponseSchema>;

export async function fetchF1Standings(signal?: AbortSignal) {
  const response = await fetch('/api/f1/standings', { signal });
  if (!response.ok) throw new Error(`F1 standings HTTP ${response.status}`);
  return F1StandingsResponseSchema.parse(await response.json());
}
