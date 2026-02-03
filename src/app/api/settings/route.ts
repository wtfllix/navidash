import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/server/storage';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings || {});
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveSettings(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
