'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, Search, X
} from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useStatsStore } from '@/store/useStatsStore';
import { Bookmark } from '@/types';
import BookmarkModal from '@/components/ui/BookmarkModal';
import SettingsModal from '@/components/settings/SettingsModal';
import { useToastStore } from '@/store/useToastStore';
import { useUIStore } from '@/store/useUIStore';
import { useTranslations } from 'next-intl';
import { getIcon } from '@/lib/iconUtils';

const filterBookmarks = (bookmarks: Bookmark[], query: string): Bookmark[] => {
  if (!query) return bookmarks;
  const lowerQuery = query.toLowerCase();
  return bookmarks
    .map<Bookmark | null>((bookmark) => {
      const matches = bookmark.title.toLowerCase().includes(lowerQuery);
      const filteredChildren = bookmark.children
        ? filterBookmarks(bookmark.children, query)
        : [];
      if (matches || filteredChildren.length > 0) {
        return { ...bookmark, children: filteredChildren.length > 0 ? filteredChildren : bookmark.children };
      }
      return null;
    })
    .filter((b): b is Bookmark => b !== null);
};

const getHostname = (url?: string) => {
  if (!url) return '';
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
};

// ─── BookmarkItem ─────────────────────────────────────────────────────────────

interface BookmarkItemProps {
  item: Bookmark;
  forceOpen?: boolean;
  onEdit: (item: Bookmark) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const BookmarkItem = ({ item, forceOpen, onEdit, onDelete, onAddChild }: BookmarkItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCategoryId, setSelectedCategoryId } = useSidebarStore();
  const t = useTranslations('General');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const isFolder = !!item.children;
  const isSelected = selectedCategoryId === item.id;

  useEffect(() => {
    if (forceOpen && isFolder) setIsOpen(true);
  }, [forceOpen, isFolder]);

  const handleClick = () => {
    if (isFolder) setIsOpen(!isOpen);
    setSelectedCategoryId(item.id);
  };

  return (
    <div className="px-1 py-0.5">
      <div
        className={cn(
          'group flex items-center py-1.5 px-2 hover:bg-gray-100/80 rounded-lg cursor-pointer transition-all duration-200',
          isSelected && 'bg-blue-50 text-blue-600 font-medium shadow-sm'
        )}
        onClick={handleClick}
      >
        <span className="mr-1 text-gray-400 group-hover:text-gray-600 transition-colors">
          {isFolder
            ? (isOpen ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />)
            : <span className="w-3.5 inline-block" />}
        </span>
        <span className="mr-1.5">
          <span className={cn('transition-colors', isSelected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700')}>
            {getIcon(item.icon, isFolder, 18)}
          </span>
        </span>
        <div className="flex-1 min-w-0">
          {item.url ? (
            <>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm truncate select-none tracking-wide hover:underline"
                onClick={(e) => { e.stopPropagation(); useStatsStore.getState().incrementVisit(item.id); }}
              >
                {item.title}
              </a>
              <span className="mt-0.5 block text-[11px] text-gray-400 truncate">{getHostname(item.url)}</span>
            </>
          ) : (
            <span className="text-sm truncate select-none tracking-wide">{item.title}</span>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
          {!isDemoMode && isFolder && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(item.id); }}
              className="p-1 hover:bg-blue-100 text-gray-400 hover:text-blue-600 rounded"
              title={t('create')} aria-label={t('create')}
            >
              <Plus size={12} />
            </button>
          )}
          {!isDemoMode && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded"
                title={t('edit')} aria-label={t('edit')}
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded"
                title={t('delete')} aria-label={t('delete')}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
      {isFolder && (
        <div className={cn(
          'border-l border-gray-100 ml-3 pl-1 overflow-hidden transition-all duration-200 ease-out',
          isOpen ? 'max-h-96 mt-1 opacity-100' : 'max-h-0 opacity-0'
        )}>
          {item.children?.map((child) => (
            <BookmarkItem
              key={child.id}
              item={child}
              forceOpen={forceOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/**
 * Sidebar Component
 * 书签管理抽屉，默认隐藏，从左侧滑入（Overlay 模式）
 */
export default function Sidebar() {
  const { bookmarks, addBookmark, removeBookmark, updateBookmark } = useBookmarkStore();
  const { isOpen, close } = useSidebarStore();
  const { addToast } = useToastStore();
  const t = useTranslations('Sidebar');
  const tGeneral = useTranslations('General');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const { isSettingsOpen, openSettings, closeSettings } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalData, setModalData] = useState<Bookmark | undefined>(undefined);
  const [modalParentId, setModalParentId] = useState<string | undefined>(undefined);

  useEffect(() => { setMounted(true); }, []);

  // 关闭侧边栏时清空搜索
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const filteredBookmarks = useMemo(
    () => filterBookmarks(bookmarks, searchQuery),
    [bookmarks, searchQuery]
  );

  const handleAddCategory = () => {
    setModalMode('add');
    setModalData(undefined);
    setModalParentId(undefined);
    setModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setModalMode('add');
    setModalData(undefined);
    setModalParentId(parentId);
    setModalOpen(true);
  };

  const handleEdit = (item: Bookmark) => {
    setModalMode('edit');
    setModalData(item);
    setModalParentId(undefined);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('delete_confirm'))) {
      removeBookmark(id);
      addToast(t('bookmark_deleted'), 'success');
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* 遮罩层：点击关闭侧边栏 */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* 侧边栏面板 */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[280px] z-50',
          'flex flex-col bg-white shadow-2xl border-r border-gray-200',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">Navidash</span>
            {isDemoMode && (
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded border border-yellow-200">
                Demo
              </span>
            )}
          </div>
          <button
            onClick={close}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-700"
            aria-label={t('toggle_sidebar')}
          >
            <X size={18} />
          </button>
        </div>

        {/* 搜索 */}
        <div className="p-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder={t('search')}
              className="w-full pl-9 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('search')}
            />
          </div>
        </div>

        {/* 书签列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredBookmarks.length > 0
            ? filteredBookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  item={bookmark}
                  forceOpen={!!searchQuery}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
              ))
            : <div className="text-center text-xs text-gray-400 py-8">{t('no_results')}</div>
          }
        </div>

        {/* 底部操作 */}
        <div className="p-3 border-t border-gray-100 shrink-0 flex flex-col gap-2">
          {!isDemoMode && (
            <button
              onClick={handleAddCategory}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-md transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 text-sm font-medium"
            >
              <Plus size={16} />
              {t('add_category')}
            </button>
          )}
          <div className="text-center">
            <span className="text-[10px] text-gray-300 font-mono select-none hover:text-gray-400 transition-colors cursor-default">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          </div>
        </div>
      </aside>

      <BookmarkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initialData={modalData}
        parentId={modalParentId}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
      />
    </>
  );
}
