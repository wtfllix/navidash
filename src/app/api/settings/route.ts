import { NextResponse } from 'next/server';
import { getSettings, saveSettings, getSettingsLastModified } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  const lastModified = await getSettingsLastModified();

  return NextResponse.json(settings || {}, {
    headers: {
      'X-Data-Version': lastModified.toString(),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveSettings(body);
    const lastModified = await getSettingsLastModified();
    return NextResponse.json({ success: true, version: lastModified });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
