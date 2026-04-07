import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getWidgetsLastModified, getWidgetLayouts, saveWidgetLayouts } from '@/lib/server/storage';
import { WidgetLayoutsArraySchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const layouts = (await getWidgetLayouts()) ?? [];
  const lastModified = await getWidgetsLastModified();

  return NextResponse.json(layouts, {
    headers: {
      'X-Data-Version': lastModified.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const layouts = WidgetLayoutsArraySchema.parse(body);
    await saveWidgetLayouts(layouts);
    const lastModified = await getWidgetsLastModified();
    return NextResponse.json({ success: true, version: lastModified });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
