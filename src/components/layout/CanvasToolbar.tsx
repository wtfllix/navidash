'use client';

import {
  Check,
  Bookmark,
  Monitor,
  PanelLeft,
  Pencil,
  RotateCcw,
  Search,
  Settings,
  Smartphone,
  Undo2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useUIStore } from '@/store/useUIStore';
import { useWidgetStore } from '@/store/useWidgetStore';

const buttonClass =
  'relative z-10 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[1.1rem] bg-transparent px-3.5 text-sm font-medium text-slate-600 outline-none transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/70 hover:text-slate-900 hover:shadow-[0_8px_18px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:bg-white/70 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0';

export default function CanvasToolbar() {
  const t = useTranslations('Header');
  const {
    isEditing,
    isLauncherOpen,
    isSettingsOpen,
    isBookmarksOpen,
    toggleEditing,
    openLauncher,
    openSettings,
    toggleBookmarks,
    closeBookmarks,
    editingLayoutMode,
    setEditingLayoutMode,
  } = useUIStore();
  const {
    canUndoMobileLayout,
    canRestoreMobileLayout,
    undoMobileLayoutChange,
    restoreMobileLayoutBaseline,
  } = useWidgetStore();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebarStore();
  const showMobileRecovery = isEditing && editingLayoutMode === 'mobile';
  const handleOpenLauncher = () => {
    closeSidebar();
    openLauncher();
  };
  const handleToggleWidgetStore = () => {
    closeBookmarks();
    toggleSidebar();
  };

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-[1.55rem] p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl scrollbar-hide"
      style={{
        background: 'rgba(241, 245, 249, 0.68)',
      }}
      aria-label={t('canvas_tools')}
    >
      {!isEditing && (
        <button
          type="button"
          onClick={handleOpenLauncher}
          title={t('open_launcher')}
          aria-label={t('open_launcher')}
          className={cn(
            buttonClass,
            isLauncherOpen && 'bg-[rgba(var(--primary-color),0.14)] text-[rgb(var(--primary-color))]'
          )}
        >
          <Search size={20} />
          <span>{t('search')}</span>
        </button>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={() => {
            closeSidebar();
            toggleBookmarks();
          }}
          title={t('bookmarks')}
          aria-label={t('bookmarks')}
          aria-expanded={isBookmarksOpen}
          className={cn(
            buttonClass,
            isBookmarksOpen &&
              'bg-[rgba(var(--primary-color),0.14)] text-[rgb(var(--primary-color))]'
          )}
        >
          <Bookmark size={20} />
          <span>{t('bookmarks')}</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleToggleWidgetStore}
        title={isSidebarOpen ? t('close_widget_store') : t('open_widget_store')}
        aria-label={isSidebarOpen ? t('close_widget_store') : t('open_widget_store')}
        aria-expanded={isSidebarOpen}
        className={cn(
          buttonClass,
          isSidebarOpen &&
            'bg-[rgba(var(--primary-color),0.14)] text-[rgb(var(--primary-color))] shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
        )}
      >
        <PanelLeft size={20} />
        <span>{isEditing ? t('add_widget') : t('widget_store')}</span>
      </button>

      {showMobileRecovery && (
        <>
          <button
            type="button"
            onClick={undoMobileLayoutChange}
            disabled={!canUndoMobileLayout}
            title={t('undo_mobile_layout')}
            aria-label={t('undo_mobile_layout')}
            className={buttonClass}
          >
            <Undo2 size={20} />
            <span>{t('undo')}</span>
          </button>
          <button
            type="button"
            onClick={restoreMobileLayoutBaseline}
            disabled={!canRestoreMobileLayout}
            title={t('restore_mobile_layout')}
            aria-label={t('restore_mobile_layout')}
            className={buttonClass}
          >
            <RotateCcw size={20} />
            <span>{t('restore')}</span>
          </button>
        </>
      )}

      {isEditing && (
        <div className="relative z-10 flex shrink-0 items-center rounded-[1.15rem] bg-white/35 p-1">
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
                  'inline-flex h-10 items-center justify-center gap-2 rounded-[0.9rem] px-3 text-sm font-medium outline-none transition-all focus:outline-none',
                  active
                    ? 'bg-[rgba(var(--primary-color),0.14)] text-[rgb(var(--primary-color))] shadow-[0_4px_12px_rgba(15,23,42,0.08)]'
                    : 'text-slate-500 hover:bg-white/55 hover:text-slate-900'
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
      )}

      <button
        type="button"
        onClick={toggleEditing}
        title={isEditing ? t('done') : t('customize')}
        aria-label={isEditing ? t('done') : t('customize')}
        className={cn(
          buttonClass,
          isEditing &&
            'bg-[rgba(var(--primary-color),0.14)] text-[rgb(var(--primary-color))] shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
        )}
      >
        {isEditing ? <Check size={20} /> : <Pencil size={20} />}
        <span>{isEditing ? t('done') : t('customize')}</span>
      </button>

      <button
        type="button"
        onClick={openSettings}
        title={t('settings')}
        aria-label={t('settings')}
        className={cn(
          buttonClass,
          isSettingsOpen &&
            'bg-[rgba(var(--primary-color),0.14)] text-[rgb(var(--primary-color))] shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
        )}
      >
        <Settings size={20} />
        <span>{t('settings')}</span>
      </button>
    </nav>
  );
}
