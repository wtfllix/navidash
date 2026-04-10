import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getWidgetsLastModified, getWidgetLayoutsByMode, saveWidgetLayouts } from '@/lib/server/storage';
import { WidgetLayoutsArraySchema, WidgetLayoutsByModeSchema } from '@/lib/schemas';
import { isServerDemoMode } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const layouts = (await getWidgetLayoutsByMode()) ?? {
    desktop: [],
    mobile: [],
  };
  const lastModified = await getWidgetsLastModified();

  return NextResponse.json(layouts, {
    headers: {
      'X-Data-Version': lastModified.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  if (isServerDemoMode) {
    return NextResponse.json({ error: 'Demo mode is read-only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const layouts = (
      WidgetLayoutsByModeSchema.safeParse(body).success
        ? WidgetLayoutsByModeSchema.parse(body)
        : {
            desktop: WidgetLayoutsArraySchema.parse(body),
            mobile: [],
          }
    );
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
