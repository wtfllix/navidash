'use client';

import React, { useEffect, useState } from 'react';
import { Bookmark, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useUIStore } from '@/store/useUIStore';
import SettingsModal from '@/components/settings/SettingsModal';
import WidgetStoreSidebar from './WidgetStoreSidebar';
import BookmarkLibraryPanel from '@/components/bookmarks/BookmarkLibraryPanel';

export default function Sidebar() {
  const { isOpen, close } = useSidebarStore();
  const { isSettingsOpen, closeSettings, isBookmarksOpen, closeBookmarks } = useUIStore();
  const t = useTranslations('Sidebar');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const isPanelOpen = isOpen || isBookmarksOpen;
  const closePanel = () => {
    close();
    closeBookmarks();
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/12 backdrop-blur-[1px] transition-opacity duration-300',
          isPanelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closePanel}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed bottom-[5.75rem] left-1/2 z-50 flex w-[calc(100%_-_1.5rem)] max-w-6xl -translate-x-1/2 flex-col overflow-hidden rounded-[2rem] bg-white/78 shadow-[0_24px_70px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl',
          isBookmarksOpen ? 'h-[min(68vh,600px)]' : 'h-[220px]',
          'origin-bottom transition-all duration-300 ease-out',
          isPanelOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-[calc(100%+7rem)] scale-[0.98] opacity-0'
        )}
        aria-label={isBookmarksOpen ? t('bookmarks') : t('widget_store')}
      >
        <div className="relative shrink-0 px-5 py-3">
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[rgb(var(--primary-color))] text-white shadow-sm">
                  {isBookmarksOpen ? <Bookmark size={15} /> : <Sparkles size={15} />}
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                    {isBookmarksOpen ? t('bookmarks') : t('widget_store')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isBookmarksOpen ? t('bookmarks_desc') : t('widget_store_desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDemoMode && (
                <span className="inline-flex shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Demo
                </span>
              )}
              <button
                onClick={closePanel}
                className="relative z-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                aria-label={isBookmarksOpen ? t('close_bookmarks') : t('toggle_sidebar')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

        </div>

        {isBookmarksOpen ? <BookmarkLibraryPanel /> : <WidgetStoreSidebar />}
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </>
  );
}
