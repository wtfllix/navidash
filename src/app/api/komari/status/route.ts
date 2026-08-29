import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getKomariStatuses } from '@/lib/server/komari';

export const dynamic = 'force-dynamic';

const querySchema = z.object({ nodeIds: z.array(z.string().uuid()).min(1).max(50) });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ nodeIds: Array.from(new Set(searchParams.getAll('nodeId'))) });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_node_ids' }, { status: 400 });

  return NextResponse.json(await getKomariStatuses(parsed.data.nodeIds), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
