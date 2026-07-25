'use client';

import React, { useMemo, useState } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Bookmark, WidgetOfType } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { recordLauncherLinkOpen } from '@/lib/linkLauncherUsage';
import { getFaviconUrl } from './editors/shared';

const SIZE_MAP = {
  md: { box: 'h-11 w-11', img: 'h-6 w-6', label: 'text-[11px]' },
  hero: { box: 'h-16 w-16', img: 'h-10 w-10', label: 'text-sm' },
} as const;

function getValidUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

function getCapacity(width: number, height: number) {
  if (width === 1 && height === 1) return 1;
  if (height === 1) return width === 3 ? 6 : 4;
  return 8;
}

function paginateBookmarks(bookmarks: Bookmark[], pageSize: number) {
  const pages: Bookmark[][] = [];
  for (let index = 0; index < bookmarks.length; index += pageSize) {
    pages.push(bookmarks.slice(index, index + pageSize));
  }
  return pages;
}

function LinkIcon({
  bookmark,
  sizeKey,
}: {
  bookmark: Bookmark;
  sizeKey: keyof typeof SIZE_MAP;
}) {
  const [failed, setFailed] = useState(false);
  const faviconUrl = getFaviconUrl(bookmark.url, sizeKey === 'hero' ? 64 : 32);
  const size = SIZE_MAP[sizeKey];

  return (
    <div
      className={cn(
        size.box,
        'flex items-center justify-center overflow-hidden transition-all duration-200 group-hover/link:-translate-y-0.5',
        sizeKey === 'hero'
          ? 'rounded-none bg-transparent'
          : 'rounded-[0.95rem] bg-white/[0.62] shadow-[0_3px_12px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-900/[0.035] group-hover/link:shadow-[0_8px_20px_rgba(15,23,42,0.10)]'
      )}
    >
      {faviconUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl}
          alt=""
          className={cn(size.img, 'object-contain')}
          onError={() => setFailed(true)}
        />
      ) : (
        <ExternalLink
          size={sizeKey === 'hero' ? 24 : 16}
          className="text-[rgb(var(--primary-color))]"
        />
      )}
    </div>
  );
}

function BookmarkLink({
  bookmark,
  showLabel,
}: {
  bookmark: Bookmark;
  showLabel: boolean;
}) {
  return (
    <a
      href={getValidUrl(bookmark.url)}
      target="_blank"
      rel="noreferrer"
      title={bookmark.title}
      className="group/link flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-1.5 transition-colors hover:bg-slate-900/[0.035]"
      onClick={(event) => {
        event.stopPropagation();
        recordLauncherLinkOpen(getValidUrl(bookmark.url));
      }}
    >
      <LinkIcon bookmark={bookmark} sizeKey="md" />
      {showLabel && (
        <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-slate-600">
          {bookmark.title}
        </span>
      )}
    </a>
  );
}

export default function LinksWidget({ widget }: { widget: WidgetOfType<'links'> }) {
  const t = useTranslations('Widgets');
  const bookmarks = useWidgetStore((state) => state.bookmarks);
  const bookmarkMap = useMemo(
    () => new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark])),
    [bookmarks]
  );
  const links = useMemo(
    () =>
      (widget.config.bookmarkIds ?? [])
        .map((id) => bookmarkMap.get(id))
        .filter((bookmark): bookmark is Bookmark => Boolean(bookmark)),
    [bookmarkMap, widget.config.bookmarkIds]
  );
  const capacity = getCapacity(widget.size.w, widget.size.h);
  const pages = paginateBookmarks(links, capacity);
  const isSingle = widget.size.w === 1 && widget.size.h === 1;
  const isSingleRow = widget.size.h === 1;
  const columns = isSingleRow ? (widget.size.w === 3 ? 6 : 4) : 4;
  const title = widget.config.title || t('links');

  if (links.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(var(--primary-color),0.07)]">
          <Link2 size={20} strokeWidth={1.5} className="text-[rgb(var(--primary-color))]/75" />
        </span>
        <span className="text-ui-muted">{t('links_empty')}</span>
      </div>
    );
  }

  if (isSingle) {
    const bookmark = links[0];
    return (
      <a
        href={getValidUrl(bookmark.url)}
        target="_blank"
        rel="noreferrer"
        title={bookmark.title}
        className="group/link flex h-full w-full flex-col items-center justify-center gap-2 p-2"
        onClick={(event) => {
          event.stopPropagation();
          recordLauncherLinkOpen(getValidUrl(bookmark.url));
        }}
      >
        <LinkIcon bookmark={bookmark} sizeKey="hero" />
        <span className="w-full truncate px-2 text-center text-sm font-semibold tracking-tight text-slate-700">
          {bookmark.title}
        </span>
      </a>
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-full flex-col',
        isSingleRow ? 'gap-0.5 px-3 py-2.5' : 'gap-2 p-4'
      )}
    >
      <p
        className={cn(
          'shrink-0 truncate font-semibold tracking-tight text-slate-700',
          isSingleRow ? 'text-[11px]' : 'text-sm'
        )}
      >
        {title}
      </p>

      <div className="hover-scrollbar min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overflow-x-hidden">
        {pages.map((page, pageIndex) => (
          <div
            key={`page-${pageIndex}`}
            className="grid min-h-full snap-start content-center gap-x-2 gap-y-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {page.map((bookmark) => (
              <BookmarkLink
                key={bookmark.id}
                bookmark={bookmark}
                showLabel={widget.config.showLabels ?? true}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
