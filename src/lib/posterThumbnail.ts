export const POSTER_THUMBNAIL_WIDTHS = [384, 640, 960, 1280, 1920] as const;

export function getPosterThumbnailWidth(
  renderedWidth: number,
  devicePixelRatio: number
): (typeof POSTER_THUMBNAIL_WIDTHS)[number] | null {
  if (renderedWidth <= 0 || devicePixelRatio <= 0) return null;

  const targetWidth = renderedWidth * Math.min(Math.max(devicePixelRatio, 1), 2);
  return (
    POSTER_THUMBNAIL_WIDTHS.find((width) => width >= targetWidth) ??
    POSTER_THUMBNAIL_WIDTHS[POSTER_THUMBNAIL_WIDTHS.length - 1]
  );
}

export function getPosterThumbnailUrl(source: string, width: number) {
  const query = new URLSearchParams({
    url: source,
    width: String(width),
  });
  return `/api/poster-thumbnail?${query.toString()}`;
}

export function isExternalPosterImage(source: string) {
  return /^https?:\/\//i.test(source);
}
