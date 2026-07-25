'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BookmarkPlus, ClipboardPaste, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import BookmarkTextImporter from '@/components/bookmarks/BookmarkTextImporter';
import { useWidgetStore } from '@/store/useWidgetStore';
import { FormField, TextInput } from './FormControls';
import { getFaviconUrl, getLinkDomain, trimToUndefined } from './shared';
import { WidgetConfigEditorProps } from './types';

export default function LinksConfigEditor({
  config,
  setConfig,
  size,
}: WidgetConfigEditorProps<'links'>) {
  const t = useTranslations('Widgets');
  const bookmarks = useWidgetStore((state) => state.bookmarks);
  const importBookmarks = useWidgetStore((state) => state.importBookmarks);
  const [query, setQuery] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const selectedIds = useMemo(() => config.bookmarkIds ?? [], [config.bookmarkIds]);
  const recommendedCapacity =
    size?.w === 1 && size.h === 1 ? 1 : size?.h === 1 ? (size.w === 3 ? 6 : 4) : 8;
  const bookmarkMap = useMemo(
    () => new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark])),
    [bookmarks]
  );
  const selectedBookmarks = selectedIds
    .map((id) => bookmarkMap.get(id))
    .filter((bookmark) => Boolean(bookmark));
  const availableBookmarks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return bookmarks.filter((bookmark) => {
      if (selectedIds.includes(bookmark.id)) return false;
      if (!normalized) return true;
      return `${bookmark.title} ${bookmark.url} ${bookmark.folder ?? ''}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [bookmarks, query, selectedIds]);

  const setBookmarkIds = (bookmarkIds: string[]) =>
    setConfig((current) => ({ ...current, bookmarkIds }));

  const moveBookmark = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    setBookmarkIds(next);
  };

  const importAndPinBookmarks = (items: typeof bookmarks) => {
    importBookmarks(items);
    const bookmarkIdsByUrl = new Map(
      useWidgetStore.getState().bookmarks.map((bookmark) => [bookmark.url, bookmark.id])
    );
    const importedIds = items
      .map((bookmark) => bookmarkIdsByUrl.get(bookmark.url))
      .filter((id): id is string => Boolean(id));
    setBookmarkIds(Array.from(new Set([...selectedIds, ...importedIds])));
    setBulkOpen(false);
    return true;
  };

  return (
    <div className="space-y-4">
      <FormField label={t('links_group_title')}>
        <TextInput
          type="text"
          value={config.title || ''}
          onChange={(event) =>
            setConfig((current) => ({ ...current, title: event.target.value }))
          }
          onBlur={(event) =>
            setConfig((current) => ({
              ...current,
              title: trimToUndefined(event.target.value),
            }))
          }
          placeholder={t('links_group_title_placeholder')}
        />
      </FormField>

      <FormField label={t('links_show_labels')}>
        <button
          type="button"
          onClick={() =>
            setConfig((current) => ({
              ...current,
              showLabels: !(current.showLabels ?? true),
            }))
          }
          className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            config.showLabels ?? true
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {(config.showLabels ?? true) ? t('links_labels_on') : t('links_labels_off')}
        </button>
      </FormField>

      <FormField
        label={t('links_pinned')}
        hint={t('links_capacity_hint', {
          count: selectedIds.length,
          capacity: recommendedCapacity,
        })}
      >
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {selectedBookmarks.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
              {t('links_no_pinned')}
            </p>
          )}
          {selectedBookmarks.map((bookmark, index) => (
            <div
              key={bookmark!.id}
              className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFaviconUrl(bookmark!.url) || ''}
                alt=""
                className="h-5 w-5 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">{bookmark!.title}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {getLinkDomain(bookmark!.url)}
                </p>
              </div>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveBookmark(index, -1)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-25"
                aria-label={t('links_move_up')}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={index === selectedBookmarks.length - 1}
                onClick={() => moveBookmark(index, 1)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-25"
                aria-label={t('links_move_down')}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => setBookmarkIds(selectedIds.filter((id) => id !== bookmark!.id))}
                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                aria-label={t('links_unpin')}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </FormField>

      <FormField label={t('links_add_from_bookmarks')}>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('links_search_bookmarks')}
            className="pl-9"
          />
        </div>
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
          {availableBookmarks.slice(0, 30).map((bookmark) => (
            <button
              key={bookmark.id}
              type="button"
              onClick={() => setBookmarkIds([...selectedIds, bookmark.id])}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-blue-50"
            >
              <BookmarkPlus size={15} className="shrink-0 text-blue-500" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {bookmark.title}
              </span>
              <span className="max-w-32 truncate text-[11px] text-slate-400">
                {getLinkDomain(bookmark.url)}
              </span>
            </button>
          ))}
          {availableBookmarks.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-slate-400">
              {t('links_no_available_bookmarks')}
            </p>
          )}
        </div>
      </FormField>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setBulkOpen((current) => !current)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            bulkOpen
              ? 'bg-blue-50 text-blue-600'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <ClipboardPaste size={15} />
          {t('links_bulk_paste')}
        </button>
        {bulkOpen && (
          <BookmarkTextImporter
            existingUrls={bookmarks.map((bookmark) => bookmark.url)}
            actionLabel={t('links_bulk_import_pin')}
            onImport={importAndPinBookmarks}
          />
        )}
      </div>
    </div>
  );
}
