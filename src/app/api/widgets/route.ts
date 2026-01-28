import { NextResponse } from 'next/server';
import { getWidgets, saveWidgets } from '@/lib/server/storage';
import { Widget } from '@/types';

export async function GET() {
  const widgets = await getWidgets();
  return NextResponse.json(widgets);
}

export async function POST(request: Request) {
  try {
    if (process.env.DEMO_MODE === 'true') {
      return NextResponse.json({ error: 'Demo mode: write operations disabled' }, { status: 403 });
    }
    const widgets: Widget[] = await request.json();
    await saveWidgets(widgets);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save widgets' }, { status: 500 });
  }
}
