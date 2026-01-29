'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronRight, ChevronDown, Folder, Globe, Menu, Server, Cpu, Wrench, PlayCircle, 
  Link as LinkIcon, Search, Plus, Edit2, Trash2, Cloud, Database, Code, Terminal, 
  Home, Star, Zap, Book, Image, Music, Video, Layers, PanelLeft,
  Settings, User, Calendar, Mail, MessageSquare, ShoppingCart, Heart, Camera, Map, FileText, Monitor, Smartphone, Wifi, Lock,
  Github, Gitlab, Twitter, Instagram, Facebook, Linkedin, Youtube, Twitch, Chrome, Slack, Figma, Dribbble, Codepen, Trello,
  Gamepad, Headphones, Tv, Bitcoin, CreditCard, Wallet, ListTodo, Clock, CheckCircle, Package, Box, Container, HardDrive,
  Bot, Brain, Sparkles, Wand2
} from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Bookmark } from '@/types';
import BookmarkModal from '@/components/ui/BookmarkModal';
import SettingsModal from '@/components/settings/SettingsModal';
import { useToastStore } from '@/store/useToastStore';
import { useUIStore } from '@/store/useUIStore';
import { useTranslations } from 'next-intl';

const iconMap: Record<string, React.ElementType> = {
  folder: Folder,
  link: LinkIcon,
  globe: Globe,
  server: Server,
  cpu: Cpu,
  tool: Wrench,
  play: PlayCircle,
  cloud: Cloud,
  database: Database,
  code: Code,
  terminal: Terminal,
  home: Home,
  star: Star,
  zap: Zap,
  book: Book,
  image: Image,
  music: Music,
  video: Video,
  settings: Settings,
  user: User,
  calendar: Calendar,
  mail: Mail,
  message: MessageSquare,
  cart: ShoppingCart,
  heart: Heart,
  camera: Camera,
  map: Map,
  file: FileText,
  monitor: Monitor,
  mobile: Smartphone,
  wifi: Wifi,
  lock: Lock,
  github: Github,
  gitlab: Gitlab,
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitch: Twitch,
  chrome: Chrome,
  slack: Slack,
  figma: Figma,
  dribbble: Dribbble,
  codepen: Codepen,
  trello: Trello,
  gamepad: Gamepad,
  headphones: Headphones,
  tv: Tv,
  bitcoin: Bitcoin,
  creditcard: CreditCard,
  wallet: Wallet,
  todo: ListTodo,
  clock: Clock,
  check: CheckCircle,
  package: Package,
  box: Box,
  container: Container,
  disk: HardDrive,
  bot: Bot,
  brain: Brain,
  sparkles: Sparkles,
  magic: Wand2
};

const getIcon = (name: string | undefined, isFolder: boolean, size: number) => {
    const Icon = iconMap[name || (isFolder ? 'folder' : 'link')] || (isFolder ? Folder : LinkIcon);
    return <Icon size={size} />;
};

const filterBookmarks = (bookmarks: Bookmark[], query: string): Bookmark[] => {
  if (!query) return bookmarks;
  const lowerQuery = query.toLowerCase();

  const mapped = bookmarks
    .map<Bookmark | null>((bookmark) => {
      const matches = bookmark.title.toLowerCase().includes(lowerQuery);
      let filteredChildren: Bookmark[] = [];
      if (bookmark.children) {
        filteredChildren = filterBookmarks(bookmark.children, query);
      }

      if (matches || filteredChildren.length > 0) {
        return {
          ...bookmark,
          children: filteredChildren.length > 0 ? filteredChildren : bookmark.children,
        };
      }
      return null;
    })
    .filter((b): b is Bookmark => b !== null);

  return mapped;
};

const getHostname = (url?: string) => {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

interface BookmarkItemProps {
  item: Bookmark;
  isCollapsed: boolean;
  forceOpen?: boolean;
  onEdit: (item: Bookmark) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const BookmarkItem = ({ item, isCollapsed, forceOpen, onEdit, onDelete, onAddChild }: BookmarkItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedCategoryId, setSelectedCategoryId, open } = useSidebarStore();
  const t = useTranslations('General');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const hasChildren = item.children && item.children.length > 0; // Just check if it has children array, technically empty array is still a folder if defined
  const isFolder = !!item.children;
  const isSelected = selectedCategoryId === item.id;

  useEffect(() => {
    if (forceOpen && isFolder) {
      setIsOpen(true);
    }
  }, [forceOpen, isFolder]);

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    }
    setSelectedCategoryId(item.id);
  };

  const handleCollapsedClick = () => {
    if (isFolder) {
        open(); // Expand the sidebar
        setIsOpen(true); // Expand the folder
        setSelectedCategoryId(item.id);
    }
  };

  if (isCollapsed) {
    return (
      <div 
        className={cn(
            "flex justify-center py-2 cursor-pointer hover:bg-gray-100/80 transition-all duration-200 relative group rounded-lg mx-1 my-1",
            isSelected && "bg-blue-50 text-blue-600 shadow-sm"
        )}
        title={item.title}
        onClick={handleCollapsedClick}
      >
        {getIcon(item.icon, isFolder, 20)}
      </div>
    );
  }

  return (
    <div className="px-1 py-0.5">
      <div
        className={cn(
            "group flex items-center py-1.5 px-2 hover:bg-gray-100/80 rounded-lg cursor-pointer transition-all duration-200",
            isSelected && "bg-blue-50 text-blue-600 font-medium shadow-sm"
        )}
        onClick={handleClick}
      >
        <span className="mr-1 text-gray-400 group-hover:text-gray-600 transition-colors">
          {isFolder ? (
            isOpen ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />
          ) : (
             <span className="w-3.5 inline-block" />
          )}
        </span>
        <span className="mr-1.5">
            <span
              className={cn(
                "transition-colors",
                isSelected ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
              )}
            >
              {getIcon(item.icon, isFolder, 18)}
            </span>
        </span>
        <div className="flex-1 min-w-0">
          {isFolder ? (
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm truncate select-none tracking-wide">
                {item.title}
              </span>
            </div>
          ) : item.url ? (
            <>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm truncate select-none tracking-wide hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.title}
              </a>
              <span className="mt-0.5 block text-[11px] text-gray-400 truncate">
                {getHostname(item.url)}
              </span>
            </>
          ) : (
            <span className="text-sm truncate select-none tracking-wide">
              {item.title}
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
            {!isDemoMode && isFolder && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddChild(item.id); }}
                    className="p-1 hover:bg-blue-100 text-gray-400 hover:text-blue-600 rounded"
                    title={t('create')}
                    aria-label={t('create')}
                >
                    <Plus size={12} />
                </button>
            )}
            {!isDemoMode && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded"
                        title={t('edit')}
                        aria-label={t('edit')}
                    >
                        <Edit2 size={12} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded"
                        title={t('delete')}
                        aria-label={t('delete')}
                    >
                        <Trash2 size={12} />
                    </button>
                </>
            )}
        </div>
      </div>
      {isFolder && (
        <div
          className={cn(
            "border-l border-gray-100 ml-3 pl-1 overflow-hidden transition-all duration-200 ease-out",
            isOpen ? "max-h-96 mt-1 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {item.children?.map((child) => (
            <BookmarkItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
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

/**
 * Sidebar Component
 * 侧边栏组件，负责展示书签分类、搜索和系统设置入口
 * 
 * 主要功能：
 * 1. 展示书签树形结构（无限层级）
 * 2. 提供两种布局模式：
 *    - Push: 侧边栏占据固定空间，挤压主内容区域
 *    - Overlay: 侧边栏悬浮在主内容之上，支持鼠标悬停自动展开
 * 3. 搜索书签功能
 * 4. 底部包含设置和布局切换按钮
 */
export default function Sidebar() {
  const { 
    bookmarks, 
    addBookmark, 
    removeBookmark, 
    updateBookmark
  } = useBookmarkStore();
  
  const { 
    isOpen, 
    toggle, 
    close, 
    open,
    layoutMode, 
    toggleLayoutMode, 
    selectedCategoryId, 
    setSelectedCategoryId 
  } = useSidebarStore();

  const { addToast } = useToastStore();
  const t = useTranslations('Sidebar');
  const tGeneral = useTranslations('General');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const { isSettingsOpen, openSettings, closeSettings } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalData, setModalData] = useState<Bookmark | undefined>(undefined);
  const [modalParentId, setModalParentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 使用 useMemo 缓存搜索结果，避免频繁重计算
  const filteredBookmarks = useMemo(() => {
      return filterBookmarks(bookmarks, searchQuery);
  }, [bookmarks, searchQuery]);

  // 处理添加分类
  const handleAddCategory = () => {
    setModalMode('add');
    setModalData(undefined);
    setModalParentId(undefined);
    setModalOpen(true);
  };

  // 处理添加子书签/子分类
  const handleAddChild = (parentId: string) => {
    setModalMode('add');
    setModalData(undefined);
    setModalParentId(parentId);
    setModalOpen(true);
  };

  const handleEdit = (item: Bookmark) => {
    setModalMode('edit');
    setModalData(item);
    setModalParentId(undefined); // Not needed for edit
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('delete_confirm'))) {
        removeBookmark(id);
        addToast(t('bookmark_deleted'), 'success');
    }
  };

  if (!mounted) {
    return (
      <aside className={cn("h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col w-[64px]")}>
         <div className="h-14 flex items-center justify-center border-b border-gray-100">
             <Menu size={20} className="text-gray-400" />
         </div>
      </aside>
    );
  }

  return (
    <>
      {/* 
        Sidebar Container
        根据 layoutMode 决定定位方式：
        - overlay: fixed 定位，z-index 高，悬浮
        - push: relative 定位，占据文档流
      */}
      <aside
        className={cn(
          "h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          layoutMode === 'overlay' ? "fixed left-0 top-0 z-50 shadow-2xl" : "relative",
          isOpen ? "w-[260px]" : "w-[64px]"
        )}
        // 鼠标进入事件：仅在 overlay 模式下触发自动展开
        onMouseEnter={(e) => {
          if (layoutMode === 'overlay' && !isOpen) {
             open();
          }
        }}
        // 鼠标离开事件：仅在 overlay 模式且未打开设置弹窗时自动收起
        onMouseLeave={(e) => {
          if (layoutMode === 'overlay' && isOpen && !isSettingsOpen) {
             close();
          }
        }}
      >
        {/* Header: Logo & Toggle Button */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
          {isOpen && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">Navidash</span>
              {isDemoMode && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded border border-yellow-200">
                  Demo
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label={t('toggle_sidebar')}
              aria-expanded={isOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

      {isOpen && (
      <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
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
      )}
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {filteredBookmarks.length > 0 ? (
            filteredBookmarks.map((bookmark) => (
            <BookmarkItem 
                key={bookmark.id} 
                item={bookmark} 
                isCollapsed={!isOpen} 
                forceOpen={!!searchQuery}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
            />
            ))
        ) : (
            isOpen && <div className="text-center text-xs text-gray-400 py-4">{t('no_results')}</div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className={cn(
        "p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50",
        !isOpen && "flex-col gap-4 p-2"
      )}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            openSettings();
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all shadow-sm hover:shadow"
          title={tGeneral('settings')}
          aria-label={tGeneral('settings')}
        >
          <Settings size={20} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleLayoutMode();
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all shadow-sm hover:shadow"
          title={layoutMode === 'overlay' ? t('switch_to_fixed') : t('switch_to_auto')}
          aria-label={layoutMode === 'overlay' ? t('switch_to_fixed') : t('switch_to_auto')}
        >
          {layoutMode === 'overlay' ? <Layers size={20} /> : <PanelLeft size={20} />}
        </button>
      </div>

      <div className="p-2 border-t border-gray-100">
        <button 
            onClick={(e) => {
                e.stopPropagation();
                handleAddCategory();
            }}
            className={cn(
                "w-full flex items-center justify-center p-2 rounded-md transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/50",
                !isOpen && "bg-transparent hover:bg-gray-100 border-transparent text-gray-500"
            )}
            title={t('add_category')}
            aria-label={t('add_category')}
        >
            <Plus size={20} />
            {isOpen && <span className="ml-2 text-sm font-medium">{t('add_category')}</span>}
        </button>
      </div>

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
    </aside>
    </>
  );
}
