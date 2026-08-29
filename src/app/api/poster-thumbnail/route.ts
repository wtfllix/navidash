import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getWidgetSnapshot } from '@/lib/server/storage';
import {
  getPosterThumbnail,
  PosterThumbnailError,
} from '@/lib/server/posterThumbnail';
import { POSTER_THUMBNAIL_WIDTHS } from '@/lib/posterThumbnail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  url: z.string().url().max(4096),
  width: z.coerce
    .number()
    .int()
    .refine((value) =>
      POSTER_THUMBNAIL_WIDTHS.includes(value as (typeof POSTER_THUMBNAIL_WIDTHS)[number])
    ),
});

async function isConfiguredPosterImage(source: string) {
  const snapshot = await getWidgetSnapshot();
  return snapshot.configs.some((entry) => {
    if (entry.type !== 'photo-frame') return false;
    const images = entry.config.images?.length
      ? entry.config.images
      : entry.config.imageUrl
        ? [entry.config.imageUrl]
        : [];
    return images.includes(source);
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      url: searchParams.get('url'),
      width: searchParams.get('width'),
    });

    if (!(await isConfiguredPosterImage(query.url))) {
      return NextResponse.json({ error: 'poster_source_not_configured' }, { status: 403 });
    }

    const thumbnail = await getPosterThumbnail(query.url, query.width);
    return new Response(new Uint8Array(thumbnail), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    if (error instanceof PosterThumbnailError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Failed to generate poster thumbnail:', error);
    return NextResponse.json({ error: 'poster_thumbnail_failed' }, { status: 502 });
  }
}
