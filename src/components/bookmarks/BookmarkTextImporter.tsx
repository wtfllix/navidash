'use client';

import React, { useMemo, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createBookmarkTextImportData } from '@/lib/bookmarkImport';
import { Bookmark } from '@/types';

interface BookmarkTextImporterProps {
  existingUrls: string[];
  actionLabel: string;
  onImport: (bookmarks: Bookmark[]) => boolean | Promise<boolean>;
  compact?: boolean;
}

export default function BookmarkTextImporter({
  existingUrls,
  actionLabel,
  onImport,
  compact = false,
}: BookmarkTextImporterProps) {
  const t = useTranslations('Bookmarks');
  const [value, setValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const parsed = useMemo(() => createBookmarkTextImportData(value, 'text-import'), [value]);
  const existingUrlSet = useMemo(() => new Set(existingUrls), [existingUrls]);
  const existingCount = parsed.bookmarks.filter((bookmark) =>
    existingUrlSet.has(bookmark.url)
  ).length;
  const newCount = parsed.count - existingCount;

  const handleImport = async () => {
    if (parsed.count === 0 || isImporting) return;
    setIsImporting(true);
    try {
      if (await onImport(parsed.bookmarks)) setValue('');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-2 rounded-2xl bg-slate-100/80 p-3">
      <div>
        <p className="text-sm font-semibold text-slate-700">{t('bulk_title')}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('bulk_description')}</p>
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('bulk_placeholder')}
        rows={compact ? 4 : 5}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/70"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span>{t('bulk_recognized', { count: parsed.count })}</span>
        <span className="text-emerald-600">{t('bulk_new', { count: newCount })}</span>
        {(existingCount > 0 || parsed.duplicateCount > 0) && (
          <span>
            {t('bulk_existing', {
              count: existingCount + parsed.duplicateCount,
            })}
          </span>
        )}
        {parsed.invalidCount > 0 && (
          <span className="text-amber-600">
            {t('bulk_invalid', { count: parsed.invalidCount })}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={handleImport}
        disabled={parsed.count === 0 || isImporting}
        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ClipboardPaste size={15} />
        {isImporting ? t('bulk_importing') : actionLabel}
      </button>
    </div>
  );
}
