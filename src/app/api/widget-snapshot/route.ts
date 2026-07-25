import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { isServerDemoMode } from '@/lib/demo';
import { WidgetSnapshotWriteSchema } from '@/lib/schemas';
import {
  getWidgetSnapshot,
  saveWidgetSnapshot,
  WidgetSnapshotConflictError,
} from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getWidgetSnapshot(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PUT(request: Request) {
  if (isServerDemoMode) {
    return NextResponse.json({ error: 'Demo mode is read-only' }, { status: 403 });
  }

  try {
    const { expectedRevision, ...snapshot } = WidgetSnapshotWriteSchema.parse(
      await request.json()
    );
    return NextResponse.json(await saveWidgetSnapshot(expectedRevision, snapshot));
  } catch (error) {
    if (error instanceof WidgetSnapshotConflictError) {
      return NextResponse.json(
        {
          error: 'revision_conflict',
          snapshot: error.currentSnapshot,
        },
        { status: 409 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error('Failed to save widget snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
