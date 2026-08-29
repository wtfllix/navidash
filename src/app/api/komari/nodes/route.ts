import { NextResponse } from 'next/server';
import { getKomariNodesResponse } from '@/lib/server/komari';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getKomariNodesResponse(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
