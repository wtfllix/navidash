import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useWidgetStore } from '@/store/useWidgetStore';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from 'next-intl';
import { widgetMeta, widgetCategories, WidgetCategory } from './registry';

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * WidgetPicker Component
 * 小组件选择器模态框
 * 允许用户从预定义列表中选择并添加新的小组件到仪表盘
 */
export default function WidgetPicker({ isOpen, onClose }: WidgetPickerProps) {
  const { widgets, addWidget } = useWidgetStore();
  const t = useTranslations('Widgets');
  const [activeCategory, setActiveCategory] = useState<'all' | WidgetCategory>('all');

  const handleAddWidget = (type: string, defaultSize: { w: number; h: number }) => {
    const cols = 8; // 默认网格列数（与 WidgetSettingsModal 中最大列数一致）

    // 生成占用网格的映射
    const grid: boolean[][] = [];
    widgets.forEach(w => {
      const x = w.position?.x || 0;
      const y = w.position?.y || 0;
      const ww = w.size.w;
      const hh = w.size.h;

      for (let dy = 0; dy < hh; dy++) {
        const row = y + dy;
        if (!grid[row]) grid[row] = [];
        for (let dx = 0; dx < ww; dx++) {
          const col = x + dx;
          grid[row][col] = true;
        }
      }
    });

    // 查找第一个能容纳新 widget 的位置
    const newWidth = defaultSize.w;
    const newHeight = defaultSize.h;
    let foundX = -1, foundY = -1;

    // 限制搜索范围：y 从 0 到 20（避免无限循环）
    outer: for (let y = 0; y < 20; y++) {
      for (let x = 0; x <= cols - newWidth; x++) {
        // 检查矩形区域是否空闲
        let canPlace = true;
        for (let dy = 0; dy < newHeight; dy++) {
          const row = y + dy;
          for (let dx = 0; dx < newWidth; dx++) {
            const col = x + dx;
            if (grid[row] && grid[row][col]) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }
        if (canPlace) {
          foundX = x;
          foundY = y;
          break outer;
        }
      }
    }

    // 如果没找到合适位置，回退到原来的逻辑（放在最底部）
    if (foundX === -1 || foundY === -1) {
      const maxY = widgets.reduce((max, w) => {
        const bottom = (w.position?.y || 0) + w.size.h;
        return bottom > max ? bottom : max;
      }, 0);
      foundX = 0;
      foundY = maxY;
    }

    addWidget({
      id: uuidv4(),
      type: type as any,
      size: defaultSize,
      position: { x: foundX, y: foundY },
      config: {},
    });
    onClose();
  };

  const categories = [
    { id: 'all' as const, labelKey: 'cat_all' },
    ...widgetCategories.map((id) => ({ id, labelKey: `cat_${id}` as const })),
  ];

  const filtered =
    activeCategory === 'all'
      ? widgetMeta
      : widgetMeta.filter((m) => m.category === activeCategory);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('add_widget_title')} className="max-w-3xl">
      {/* Categories */}
      <div className="flex space-x-2 mb-6 border-b border-gray-100 pb-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-gray-900 text-white shadow-sm scale-105'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t(cat.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
        {filtered.map((meta) => (
          <button
            key={meta.type}
            onClick={() => handleAddWidget(meta.type, meta.defaultSize)}
            className="flex flex-col items-center p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`${t('add_widget_title')} - ${t(meta.titleKey as any)}`}
          >
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors mb-4 ring-1 ring-gray-100 group-hover:ring-blue-100">
              <meta.Icon size={32} className={meta.iconClassName} />
            </div>
            <h4 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
              {t(meta.titleKey as any)}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2 px-1 leading-relaxed">
              {t(meta.descKey as any)}
            </p>
          </button>
        ))}
      </div>
    </Modal>
  );
}
