import { NextResponse } from 'next/server';
import { getSettings, saveSettings, getSettingsLastModified } from '@/lib/server/storage';
import { normalizeSettings, SettingsSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = normalizeSettings(await getSettings());
  const lastModified = await getSettingsLastModified();

  return NextResponse.json(settings, {
    headers: {
      'X-Data-Version': lastModified.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = SettingsSchema.parse(body);
    await saveSettings(settings);
    const lastModified = await getSettingsLastModified();
    return NextResponse.json({ success: true, version: lastModified });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', JSON.stringify(error.flatten(), null, 2));
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
