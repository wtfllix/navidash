import { NextResponse } from 'next/server';
import {
  fetchServerWeather,
  getWeatherPublicConfig,
} from '@/lib/server/weather';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getWeatherPublicConfig(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST() {
  const status = getWeatherPublicConfig();

  if (!status.configured) {
    return NextResponse.json(
      { ok: false, error: 'missing_key' },
      { status: 400 }
    );
  }

  try {
    await fetchServerWeather({
      lat: 22.5431,
      lon: 114.0579,
      locale: 'en',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'request_failed' },
      { status: 502 }
    );
  }
}
