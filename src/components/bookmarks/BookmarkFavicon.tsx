'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFaviconUrl } from '@/components/widgets/editors/shared';

interface BookmarkFaviconProps {
  url: string;
  size?: number;
  fallbackSize?: number;
  className?: string;
  fallbackClassName?: string;
}

export default function BookmarkFavicon({
  url,
  size = 32,
  fallbackSize = 18,
  className,
  fallbackClassName,
}: BookmarkFaviconProps) {
  const faviconUrl = getFaviconUrl(url, size);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!faviconUrl || failedUrl === faviconUrl) {
    return (
      <Globe
        aria-hidden="true"
        size={fallbackSize}
        strokeWidth={1.75}
        className={cn('shrink-0 text-[rgb(var(--primary-color))]', fallbackClassName)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl}
      alt=""
      className={className}
      onLoad={(event) => {
        const { naturalHeight, naturalWidth } = event.currentTarget;
        if (size > 16 && naturalWidth === 16 && naturalHeight === 16) {
          setFailedUrl(faviconUrl);
        }
      }}
      onError={() => setFailedUrl(faviconUrl)}
    />
  );
}
