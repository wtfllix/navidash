'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Edit2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWidgetStore } from '@/store/useWidgetStore';
import { getLinkDomain } from '@/components/widgets/editors/shared';
import { createBookmarkImportData } from '@/lib/bookmarkImport';
import { useToastStore } from '@/store/useToastStore';
import BookmarkFavicon from './BookmarkFavicon';
import BookmarkTextImporter from './BookmarkTextImporter';

interface Draft {
  title: string;
  url: string;
}

const EMPTY_DRAFT: Draft = { title: '', url: '' };

export default function BookmarkLibraryPanel() {
  const t = useTranslations('Bookmarks');
  const {
    bookmarks,
    widgetConfigs,
    addBookmark,
    updateBookmark,
    removeBookmark,
    importBookmarks,
    saveWidgetConfigs,
  } = useWidgetStore();
  const addToast = useToastStore((state) => state.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return bookmarks;
    return bookmarks.filter((bookmark) =>
      `${bookmark.title} ${bookmark.url} ${bookmark.folder ?? ''}`
        .toLowerCase()
        .includes(normalized)
    );
  }, [bookmarks, query]);

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setAdding(false);
    setEditingId(null);
  };

  const saveDraft = () => {
    if (!draft.url.trim()) return;
    const title = draft.title.trim() || getLinkDomain(draft.url);
    const saved = editingId
      ? updateBookmark(editingId, { title, url: draft.url.trim() })
      : Boolean(addBookmark({ title, url: draft.url.trim() }));
    if (saved) resetDraft();
  };

  const startEditing = (id: string) => {
    const bookmark = bookmarks.find((item) => item.id === id);
    if (!bookmark) return;
    setEditingId(id);
    setAdding(false);
    setBulkAdding(false);
    setDraft({ title: bookmark.title, url: bookmark.url });
  };

  const handleDelete = (id: string) => {
    const references = widgetConfigs.filter(
      (entry) =>
        entry.type === 'links' && (entry.config.bookmarkIds ?? []).includes(id)
    ).length;
    if (
      references > 0 &&
      !window.confirm(t('delete_referenced_confirm', { count: references }))
    ) {
      return;
    }
    removeBookmark(id);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const result = createBookmarkImportData(String(loadEvent.target?.result ?? ''));
        if (result.count === 0) throw new Error('No supported bookmarks');
        if (!window.confirm(t('import_confirm', { count: result.count }))) return;
        const added = importBookmarks(result.bookmarks);
        if (!(await saveWidgetConfigs())) throw new Error('Snapshot save failed');
        addToast(t('imported', { count: added }), 'success');
      } catch {
        addToast(t('import_failed'), 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleTextImport = async (items: Parameters<typeof importBookmarks>[0]) => {
    try {
      const added = importBookmarks(items);
      if (!(await saveWidgetConfigs())) throw new Error('Snapshot save failed');
      addToast(t('imported', { count: added }), 'success');
      setBulkAdding(false);
      return true;
    } catch {
      addToast(t('import_failed'), 'error');
      return false;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white/70">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <div className="relative min-w-52 flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100/70"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setBulkAdding((current) => !current);
            setAdding(false);
            setEditingId(null);
          }}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
            bulkAdding
              ? 'bg-blue-50 text-blue-600'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardPaste size={15} />
          {t('bulk_paste')}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Upload size={15} />
          {t('import')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,text/html"
          onChange={handleImport}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setBulkAdding(false);
            setEditingId(null);
            setDraft(EMPTY_DRAFT);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={15} />
          {t('add')}
        </button>
      </div>

      {bulkAdding && (
        <div className="mx-4 mb-2 shrink-0">
          <BookmarkTextImporter
            existingUrls={bookmarks.map((bookmark) => bookmark.url)}
            actionLabel={t('bulk_import_library')}
            onImport={handleTextImport}
          />
        </div>
      )}

      {(adding || editingId) && (
        <div className="mx-4 mb-2 grid shrink-0 gap-2 rounded-2xl bg-slate-100/80 p-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto]">
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder={t('title_placeholder')}
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
          <input
            value={draft.url}
            onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
            onKeyDown={(event) => event.key === 'Enter' && saveDraft()}
            placeholder={t('url_placeholder')}
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
          />
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={saveDraft}
              disabled={!draft.url.trim()}
              className="rounded-xl p-2 text-emerald-600 hover:bg-white disabled:opacity-30"
              aria-label={t('save')}
            >
              <Check size={17} />
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-xl p-2 text-slate-400 hover:bg-white"
              aria-label={t('cancel')}
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group flex min-w-0 items-center gap-3 rounded-2xl bg-white/80 px-3 py-2.5 shadow-[0_3px_12px_rgba(15,23,42,0.05)]"
              >
                <BookmarkFavicon
                  url={bookmark.url}
                  fallbackSize={20}
                  className="h-7 w-7 shrink-0 object-contain"
                  fallbackClassName="h-7 w-7 p-1"
                />
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {bookmark.title}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {getLinkDomain(bookmark.url)}
                  </p>
                </a>
                <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover:opacity-100">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={t('open')}
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => startEditing(bookmark.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={t('edit')}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(bookmark.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label={t('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {query ? t('no_results') : t('empty')}
          </div>
        )}
      </div>
    </div>
  );
}
