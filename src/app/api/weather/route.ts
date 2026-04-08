import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchServerWeather } from '@/lib/server/weather';

export const dynamic = 'force-dynamic';

const weatherQuerySchema = z.object({
  lat: z.coerce.number().finite(),
  lon: z.coerce.number().finite(),
  locale: z.string().optional(),
  host: z.string().optional(),
  authType: z.enum(['apikey', 'jwt', 'param', 'bearer']).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = weatherQuerySchema.parse({
      lat: searchParams.get('lat'),
      lon: searchParams.get('lon'),
      locale: searchParams.get('locale') ?? undefined,
      host: searchParams.get('host') ?? undefined,
      authType: searchParams.get('authType') ?? undefined,
    });

    const weather = await fetchServerWeather({
      lat: query.lat,
      lon: query.lon,
      locale: query.locale ?? 'en',
      host: query.host,
      authType:
        query.authType === 'jwt' || query.authType === 'bearer'
          ? 'jwt'
          : query.authType
            ? 'apikey'
            : undefined,
    });

    return NextResponse.json(weather, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Weather fetch failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
