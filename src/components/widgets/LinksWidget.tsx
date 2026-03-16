'use client';

import React, { useState } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Widget, LinkItem } from '@/types';

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
  sm: { box: 'w-8 h-8',   img: 'w-5 h-5', label: 'text-[10px] max-w-[3rem]' },
  md: { box: 'w-10 h-10', img: 'w-6 h-6', label: 'text-[11px] max-w-[4rem]' },
  lg: { box: 'w-12 h-12', img: 'w-7 h-7', label: 'text-xs    max-w-[4.5rem]' },
} as const;

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
        'group-hover:scale-110 group-hover:shadow-md transition-all duration-200'
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

export default function LinksWidget({ widget }: { widget: Widget }) {
  const t = useTranslations('Widgets');
  const {
    title,
    links = [],
    showLabels = true,
    iconSize = 'md',
  } = widget.config;

  const size = SIZE_MAP[iconSize ?? 'md'];

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
      {title && (
        <p className="text-xs font-semibold text-gray-500 truncate shrink-0">{title}</p>
      )}
      <div className="flex flex-wrap gap-2 content-start overflow-hidden">
        {links.map((link) => (
          <a
            key={link.id}
            href={getValidUrl(link.url)}
            target="_blank"
            rel="noreferrer"
            title={link.title}
            className="flex flex-col items-center gap-1 group"
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
    </div>
  );
}
