'use client';

import { useMemo } from 'react';
import { Clock3, CornerDownLeft, History, Keyboard, Link2, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { LauncherLinkItem } from '@/lib/linkLauncher';
import {
  LauncherOpenedLinkHistoryItem,
  LauncherSearchHistoryItem,
} from '@/lib/linkLauncherHistory';

export interface CanvasLauncherListItem {
  id: string;
  kind: 'link' | 'search';
  title: string;
  subtitle: string;
  sourceLabel?: string;
  link?: LauncherLinkItem;
  query?: string;
}

interface CanvasLinkLauncherProps {
  isOpen: boolean;
  query: string;
  items: CanvasLauncherListItem[];
  selectedIndex: number;
  searchHistory: LauncherSearchHistoryItem[];
  openedLinks: LauncherOpenedLinkHistoryItem[];
  onClose: () => void;
  onSelect: (item: CanvasLauncherListItem) => void;
}

export default function CanvasLinkLauncher({
  isOpen,
  query,
  items,
  selectedIndex,
  searchHistory,
  openedLinks,
  onClose,
  onSelect,
}: CanvasLinkLauncherProps) {
  const t = useTranslations('Widgets');
  const showHistory = !query.trim();

  const resultSummary = useMemo(() => {
    if (showHistory) {
      if (searchHistory.length === 0 && openedLinks.length === 0) {
        return t('launcher_ready');
      }

      return t('launcher_history_ready');
    }

    return t('launcher_results', { count: items.length });
  }, [items.length, openedLinks.length, searchHistory.length, showHistory, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('launcher_title')}
      className="max-w-lg"
      bodyClassName="px-0 py-0"
    >
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Keyboard size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{query || t('launcher_placeholder')}</p>
            <p className="mt-1 text-xs text-gray-500">{resultSummary}</p>
          </div>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto px-3 py-3">
        {items.length > 0 ? (
          <div className="space-y-3">
            {showHistory && searchHistory.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                  <History size={12} />
                  {t('launcher_recent_searches')}
                </div>
                <div className="space-y-1">
                  {items
                    .filter((item) => item.kind === 'search')
                    .map((item) => {
                      const index = items.findIndex((currentItem) => currentItem.id === item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelect(item)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                            index === selectedIndex
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-50 text-gray-900'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                              index === selectedIndex
                                ? 'bg-white/14 text-white'
                                : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            <Search size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{item.title}</div>
                            <div
                              className={cn(
                                'truncate text-xs',
                                index === selectedIndex ? 'text-white/75' : 'text-gray-500'
                              )}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ) : null}

            {showHistory && openedLinks.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">
                  <Clock3 size={12} />
                  {t('launcher_recent_links')}
                </div>
                <div className="space-y-1">
                  {items
                    .filter((item) => item.kind === 'link')
                    .map((item) => {
                      const index = items.findIndex((currentItem) => currentItem.id === item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelect(item)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                            index === selectedIndex
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-50 text-gray-900'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                              index === selectedIndex
                                ? 'bg-white/14 text-white'
                                : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            <Link2 size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{item.title}</div>
                            <div
                              className={cn(
                                'truncate text-xs',
                                index === selectedIndex ? 'text-white/75' : 'text-gray-500'
                              )}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                          <div
                            className={cn(
                              'shrink-0 text-[11px]',
                              index === selectedIndex ? 'text-white/75' : 'text-gray-400'
                            )}
                          >
                            {item.sourceLabel}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ) : null}

            {!showHistory ? items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  index === selectedIndex ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-900'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    index === selectedIndex ? 'bg-white/14 text-white' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <Link2 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div
                    className={cn(
                      'truncate text-xs',
                      index === selectedIndex ? 'text-white/75' : 'text-gray-500'
                    )}
                  >
                    {item.subtitle}
                  </div>
                </div>
                <div
                  className={cn(
                    'shrink-0 text-[11px]',
                    index === selectedIndex ? 'text-white/75' : 'text-gray-400'
                  )}
                >
                  {item.sourceLabel}
                </div>
              </button>
            )) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Link2 size={18} />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-800">{t('launcher_empty_title')}</p>
            <p className="mt-1 text-xs text-gray-500">{t('launcher_empty_desc')}</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
        <div className="flex items-center justify-between gap-4">
          <span>{t('launcher_hint_type')}</span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={12} />
            {t('launcher_hint_enter')}
          </span>
        </div>
      </div>
    </Modal>
  );
}
