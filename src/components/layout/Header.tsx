'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Monitor,
  PanelLeft,
  Pencil,
  Smartphone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { buildSearchUrl, DEFAULT_SEARCH_ENGINE, SEARCH_ENGINES } from '@/lib/searchEngines';

export default function Header() {
  const t = useTranslations('Header');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState(DEFAULT_SEARCH_ENGINE);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isEditing,
    toggleEditing,
    openWidgetPicker,
    openSettings,
    editingLayoutMode,
    setEditingLayoutMode,
  } = useUIStore();
  const {
    canUndoMobileLayout,
    canRestoreMobileLayout,
    undoMobileLayoutChange,
    restoreMobileLayoutBaseline,
  } = useWidgetStore();
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

    window.open(buildSearchUrl(query, engine), '_blank');
    setQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const showMobileLayoutRecovery = isEditing && editingLayoutMode === 'mobile';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/88 px-3 py-3 backdrop-blur-xl transition-all sm:px-4">
      <div className="hidden items-center gap-3 md:flex">
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
            <span>{t('widget_store')}</span>
          </span>
        </button>

        <div className="relative z-50 mx-auto w-full max-w-3xl flex-1">
          <form
            onSubmit={handleSearch}
            role="search"
            className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-100/78 shadow-sm transition-all duration-200 hover:bg-slate-100 focus-within:border-slate-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-[rgba(var(--primary-color),0.12)]"
          >
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSearchDropdownOpen((prev) => !prev)}
                className="flex h-11 w-12 items-center justify-center rounded-l-2xl border-r border-slate-200 bg-white/70 text-sm font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-700 sm:w-14"
                aria-expanded={isSearchDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('search_engine')}
              >
                {engine.icon}
              </button>

              {isSearchDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSearchDropdownOpen(false)} />
                  <div
                    className="absolute left-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/8"
                    role="listbox"
                  >
                    {SEARCH_ENGINES.map((eng) => (
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
              className="h-11 w-full bg-transparent px-3 pr-14 text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:px-4 sm:pr-24"
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
          {showMobileLayoutRecovery && (
            <>
              <button
                type="button"
                onClick={undoMobileLayoutChange}
                disabled={!canUndoMobileLayout}
                title={t('undo_mobile_layout')}
                aria-label={t('undo_mobile_layout')}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-medium text-slate-600 transition-colors enabled:hover:border-slate-300 enabled:hover:bg-slate-50 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="flex items-center gap-2">
                  <Undo2 size={18} />
                  <span className="hidden lg:inline">{t('undo')}</span>
                </span>
              </button>

              <button
                type="button"
                onClick={restoreMobileLayoutBaseline}
                disabled={!canRestoreMobileLayout}
                title={t('restore_mobile_layout')}
                aria-label={t('restore_mobile_layout')}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-medium text-slate-600 transition-colors enabled:hover:border-slate-300 enabled:hover:bg-slate-50 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw size={18} />
                  <span className="hidden xl:inline">{t('restore')}</span>
                </span>
              </button>
            </>
          )}

          {isEditing && (
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1">
              {[
                { key: 'desktop', label: t('layout_desktop'), Icon: Monitor },
                { key: 'mobile', label: t('layout_mobile'), Icon: Smartphone },
              ].map(({ key, label, Icon }) => {
                const active = editingLayoutMode === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditingLayoutMode(key as 'desktop' | 'mobile')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    aria-pressed={active}
                    title={label}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>
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
        </div>

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

      <div className="flex flex-col gap-2.5 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            title={isSidebarOpen ? t('close_widget_store') : t('open_widget_store')}
            aria-label={isSidebarOpen ? t('close_widget_store') : t('open_widget_store')}
            aria-expanded={isSidebarOpen}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200',
              isSidebarOpen
                ? 'border-transparent bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600'
            )}
          >
            <PanelLeft size={18} />
          </button>

          <div className="relative z-50 min-w-0 flex-1">
            <form
              onSubmit={handleSearch}
              role="search"
              className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-100/80 shadow-sm focus-within:border-slate-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-[rgba(var(--primary-color),0.12)]"
            >
              <button
                type="button"
                onClick={() => setIsSearchDropdownOpen((prev) => !prev)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-2xl border-r border-slate-200 bg-white/70 text-sm font-medium text-slate-500"
                aria-expanded={isSearchDropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('search_engine')}
              >
                {engine.icon}
              </button>

              {isSearchDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSearchDropdownOpen(false)} />
                  <div
                    className="absolute left-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/8"
                    role="listbox"
                  >
                    {SEARCH_ENGINES.map((eng) => (
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

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={t('search_placeholder', { engine: engine.name })}
                className="h-11 min-w-0 flex-1 bg-transparent px-3 pr-12 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                aria-label={t('search_query')}
              />

              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400"
                aria-label={t('search_action')}
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          <button
            onClick={toggleEditing}
            title={isEditing ? t('done') : t('customize')}
            aria-label={isEditing ? t('done') : t('customize')}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200',
              isEditing
                ? 'border-transparent bg-slate-900 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600'
            )}
          >
            {isEditing ? <Check size={18} /> : <Pencil size={18} />}
          </button>

          <button
            onClick={openSettings}
            title={t('settings')}
            aria-label={t('settings')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {showMobileLayoutRecovery && (
              <>
                <button
                  type="button"
                  onClick={undoMobileLayoutChange}
                  disabled={!canUndoMobileLayout}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Undo2 size={16} />
                  <span>{t('undo')}</span>
                </button>

                <button
                  type="button"
                  onClick={restoreMobileLayoutBaseline}
                  disabled={!canRestoreMobileLayout}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RotateCcw size={16} />
                  <span>{t('restore')}</span>
                </button>
              </>
            )}

            <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1">
              {[
                { key: 'desktop', label: t('layout_desktop'), Icon: Monitor },
                { key: 'mobile', label: t('layout_mobile'), Icon: Smartphone },
              ].map(({ key, label, Icon }) => {
                const active = editingLayoutMode === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditingLayoutMode(key as 'desktop' | 'mobile')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    )}
                    aria-pressed={active}
                    title={label}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={openWidgetPicker}
              title={t('add_widget')}
              aria-label={t('add_widget')}
              className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(var(--primary-color),0.18)] bg-[rgba(var(--primary-color),0.08)] px-3 py-2 text-sm font-medium text-[rgb(var(--primary-color))]"
            >
              <Plus size={18} />
              <span>{t('add_widget')}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
