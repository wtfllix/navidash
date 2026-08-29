import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const value = process.env.KOMARI_BASE_URL?.trim();
  if (!value) return NextResponse.json({ error: 'not_configured' }, { status: 404 });

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Invalid protocol');
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: 'not_configured' }, { status: 404 });
  }
}
