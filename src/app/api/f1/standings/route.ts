import { NextResponse } from 'next/server';
import { getF1DriverStandings } from '@/lib/server/f1Standings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getF1DriverStandings(), {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-if-error=604800',
      },
    });
  } catch {
    return NextResponse.json({ error: 'f1_standings_unavailable' }, { status: 503 });
  }
}
