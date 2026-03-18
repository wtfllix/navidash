'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useUIStore } from '@/store/useUIStore';
import { useTranslations } from 'next-intl';
import WidgetStoreSidebar from './WidgetStoreSidebar';
import SettingsModal from '@/components/settings/SettingsModal';

/**
 * Sidebar Component
 * 侧边栏抽屉，默认隐藏，从左侧滑入（Overlay 模式）
 * 现在包含小组件商店功能，替换原有的书签管理
 */
export default function Sidebar() {
  const { isOpen, close } = useSidebarStore();
  const t = useTranslations('Sidebar');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const { isSettingsOpen, closeSettings } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

        {/* 小组件商店内容 */}
        <WidgetStoreSidebar />
      </aside>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
      />
    </>
  );
}