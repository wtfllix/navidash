'use client';

import React, { useState } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { LinkItem, WidgetOfType } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

const getValidUrl = (url: string) =>
  url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

// ─── Icon sizes ───────────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm: { box: 'w-8 h-8', img: 'w-5 h-5', item: 'w-12', label: 'text-[10px] w-full' },
  md: { box: 'w-10 h-10', img: 'w-6 h-6', item: 'w-16', label: 'text-[11px] w-full' },
  lg: { box: 'w-12 h-12', img: 'w-7 h-7', item: 'w-[4.5rem]', label: 'text-xs w-full' },
} as const;

const getGridColumnsClass = (width: number, height: number) => {
  if (width === 2 && height === 2) return 'grid-cols-4';
  if (width === 3 && height === 1) return 'grid-cols-6';
  return 'grid-cols-4';
};

const getColumnCount = (width: number, height: number) => {
  if (width === 3 && height === 1) return 6;
  return 4;
};

const chunkLinks = (links: LinkItem[], chunkSize: number) => {
  const rows: LinkItem[][] = [];

  for (let index = 0; index < links.length; index += chunkSize) {
    rows.push(links.slice(index, index + chunkSize));
  }

  return rows;
};

// ─── LinkIcon ─────────────────────────────────────────────────────────────────

function LinkIcon({ link, sizeKey }: { link: LinkItem; sizeKey: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const faviconUrl = getFaviconUrl(link.url);
  const { box, img } = SIZE_MAP[sizeKey];

  return (
    <div
      className={cn(
        box,
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        'flex items-center justify-center overflow-hidden',
        'transition-all duration-200 group-hover/link:scale-110 group-hover/link:shadow-md'
      )}
    >
      {faviconUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl}
          alt=""
          className={cn(img, 'object-contain')}
          onError={() => setFailed(true)}
        />
      ) : (
        <ExternalLink size={16} className="text-blue-400" />
      )}
    </div>
  );
}

// ─── LinksWidget ──────────────────────────────────────────────────────────────

export default function LinksWidget({ widget }: { widget: WidgetOfType<'links'> }) {
  const t = useTranslations('Widgets');
  const { title, links = [], showLabels = true, iconSize = 'md' } = widget.config;

  const size = SIZE_MAP[iconSize ?? 'md'];
  const isSingleRow = widget.size.h === 1;
  const columnCount = getColumnCount(widget.size.w, widget.size.h);
  const gridColumnsClass = getGridColumnsClass(widget.size.w, widget.size.h);
  const linkRows = isSingleRow ? chunkLinks(links, columnCount) : [];

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
        <Link2 size={22} strokeWidth={1.5} />
        <span className="text-xs">{t('links_empty')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3 gap-2 overflow-hidden">
      <div className="shrink-0">
        {title ? (
          <p className="text-xs font-semibold text-gray-500 truncate">{title}</p>
        ) : (
          <p className="text-xs font-semibold text-gray-400">{t('links')}</p>
        )}
      </div>
      {isSingleRow ? (
        <div className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden pr-1 snap-y snap-mandatory">
          <div className="space-y-3">
            {linkRows.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className={cn('grid snap-start gap-x-2', gridColumnsClass)}
              >
                {row.map((link) => (
                  <a
                    key={link.id}
                    href={getValidUrl(link.url)}
                    target="_blank"
                    rel="noreferrer"
                    title={link.title}
                    className={cn(
                      'group/link flex min-w-0 flex-col items-center gap-1.5 p-0.5',
                      showLabels && size.item
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon link={link} sizeKey={iconSize ?? 'md'} />
                    {showLabels && (
                      <span
                        className={cn(
                          size.label,
                          'text-gray-600 truncate text-center leading-tight'
                        )}
                      >
                        {link.title}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'scrollbar-hide grid flex-1 content-start gap-x-2 gap-y-3 overflow-y-auto overflow-x-hidden pr-1',
            gridColumnsClass
          )}
        >
          {links.map((link) => (
            <a
              key={link.id}
              href={getValidUrl(link.url)}
              target="_blank"
              rel="noreferrer"
              title={link.title}
              className={cn(
                'group/link flex min-w-0 flex-col items-center gap-1.5 p-0.5',
                showLabels && 'w-full'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon link={link} sizeKey={iconSize ?? 'md'} />
              {showLabels && (
                <span
                  className={cn(
                    size.label,
                    'text-gray-600 truncate text-center leading-tight'
                  )}
                >
                  {link.title}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
