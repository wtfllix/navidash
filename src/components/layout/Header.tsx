'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  PanelLeft,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { isClientDemoMode } from '@/lib/demo';

const ENGINES = [
  { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'G' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'B' },
  { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'du' },
  { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'Gh' },
];

export default function Header() {
  const t = useTranslations('Header');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState(ENGINES[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDemoMode = isClientDemoMode;

  const { isEditing, toggleEditing, openWidgetPicker, openSettings } = useUIStore();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
    setQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/82 px-4 py-3 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-white shadow-sm">
            <Sparkles size={15} />
            <span className="text-sm font-semibold tracking-[-0.02em]">NaviDash</span>
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          title={isSidebarOpen ? t('close_widget_store') : t('open_widget_store')}
          aria-label={isSidebarOpen ? t('close_widget_store') : t('open_widget_store')}
          aria-expanded={isSidebarOpen}
          className={cn(
            'shrink-0 rounded-2xl border px-3 py-2 text-[15px] font-medium transition-all duration-200',
            isSidebarOpen
              ? 'border-transparent bg-slate-900 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <span className="flex items-center gap-2">
            <PanelLeft size={18} />
            <span className="hidden sm:inline">{t('widget_store')}</span>
          </span>
        </button>

        <div className="relative z-30 mx-auto w-full max-w-3xl flex-1">
          <form
            onSubmit={handleSearch}
            role="search"
            className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-100/75 shadow-sm transition-all duration-200 hover:bg-slate-100 focus-within:border-slate-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-[rgba(var(--primary-color),0.12)]"
          >
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchDropdownOpen((prev) => !prev)}
                className="flex h-11 w-14 items-center justify-center rounded-l-2xl border-r border-slate-200 bg-white/70 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                aria-expanded={isSearchDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('search_engine')}
              >
                {engine.icon}
              </button>

              {isSearchDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSearchDropdownOpen(false)} />
                  <div
                    className="absolute left-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/8"
                    role="listbox"
                  >
                    {ENGINES.map((eng) => (
                      <button
                        key={eng.name}
                        type="button"
                        onClick={() => {
                          setEngine(eng);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        role="option"
                        aria-selected={engine.name === eng.name}
                      >
                        <span>{eng.name}</span>
                        {engine.name === eng.name && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--primary-color))]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t('search_placeholder', { engine: engine.name })}
              className="h-11 w-full bg-transparent px-4 pr-24 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              aria-label={t('search_query')}
            />

            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              <span className="hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-normal text-slate-400 md:inline-flex">
                Ctrl+K
              </span>
              <button
                type="submit"
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label={t('search_action')}
              >
                <Search size={18} />
              </button>
            </div>
          </form>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          {isDemoMode && (
            <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 md:inline-flex">
              Demo resets on refresh
            </span>
          )}

          {isEditing && (
            <button
              onClick={openWidgetPicker}
              title={t('add_widget')}
              aria-label={t('add_widget')}
              className="rounded-2xl border border-[rgba(var(--primary-color),0.18)] bg-[rgba(var(--primary-color),0.08)] px-3 py-2 text-[15px] font-medium text-[rgb(var(--primary-color))] transition-colors hover:bg-[rgba(var(--primary-color),0.12)]"
            >
              <span className="flex items-center gap-2">
                <Plus size={18} />
                <span className="hidden md:inline">{t('add_widget')}</span>
              </span>
            </button>
          )}

          <button
            onClick={toggleEditing}
            title={isEditing ? t('done') : t('customize')}
            aria-label={isEditing ? t('done') : t('customize')}
            className={cn(
              'rounded-2xl border px-3 py-2 text-[15px] font-medium transition-all duration-200',
              isEditing
                ? 'border-transparent bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <span className="flex items-center gap-2">
              {isEditing ? <Check size={18} /> : <Pencil size={18} />}
              <span className="hidden md:inline">{isEditing ? t('done') : t('customize')}</span>
            </span>
          </button>

          <button
            onClick={openSettings}
            title={t('settings')}
            aria-label={t('settings')}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Settings size={18} />
              <span className="hidden lg:inline">{t('settings')}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
