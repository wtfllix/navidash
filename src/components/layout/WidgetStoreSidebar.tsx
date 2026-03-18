'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useTranslations } from 'next-intl';
import { widgetMeta, widgetCategories, WidgetCategory } from '@/components/widgets/registry';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import DraggableWidgetItem from './DraggableWidgetItem';
import { buildPlacementResult } from '@/lib/widgetPlacement';

/**
 * WidgetStoreSidebar Component
 * 小组件商店侧边栏，替换原有的书签侧边栏
 * 允许用户浏览、搜索和添加小组件到仪表盘
 */
export default function WidgetStoreSidebar() {
  const { widgets, addWidgetWithLayout } = useWidgetStore();
  const t = useTranslations('Widgets');
  const [activeCategory, setActiveCategory] = useState<'all' | WidgetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 处理添加小组件（复用 WidgetPicker 的布局算法）
  const handleAddWidget = (type: string, defaultSize: { w: number; h: number }) => {
    const placement = buildPlacementResult({
      widgets,
      widgetType: type as any,
      widgetId: uuidv4(),
      defaultSize,
      cols: 8,
    });
    addWidgetWithLayout(placement.newWidget, placement.positionUpdates);
  };

  // 分类列表
  const categories = [
    { id: 'all' as const, labelKey: 'cat_all' },
    ...widgetCategories.map((id) => ({ id, labelKey: `cat_${id}` as const })),
  ];

  // 根据分类和搜索过滤小组件
  const filteredWidgets = useMemo(() => {
    let filtered = activeCategory === 'all'
      ? widgetMeta
      : widgetMeta.filter((m) => m.category === activeCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meta =>
        t(meta.titleKey as any).toLowerCase().includes(query) ||
        t(meta.descKey as any).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeCategory, searchQuery, t]);

  return (
    <div className="flex flex-col h-full">
      {/* 搜索栏 */}
      <div className="p-3 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder={t('search_widgets') || '搜索小组件...'}
            className="w-full pl-9 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search widgets"
          />
        </div>
      </div>

      {/* 分类选项卡 */}
      <div className="p-3 border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap',
                activeCategory === cat.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {t(cat.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

      {/* 小组件网格 */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredWidgets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredWidgets.map((meta) => (
              <DraggableWidgetItem
                key={meta.type}
                meta={meta}
                onClick={() => handleAddWidget(meta.type, meta.defaultSize)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-400 py-8">
            {searchQuery.trim() ? t('no_search_results') || '没有找到匹配的小组件' : t('no_widgets') || '暂无小组件'}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-3 border-t border-gray-100 shrink-0 text-center">
        <span className="text-[10px] text-gray-300 font-mono select-none hover:text-gray-400 transition-colors cursor-default">
          Widget Store
        </span>
      </div>
    </div>
  );
}
