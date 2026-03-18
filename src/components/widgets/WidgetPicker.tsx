import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useWidgetStore } from '@/store/useWidgetStore';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from 'next-intl';
import { widgetMeta, widgetCategories, WidgetCategory } from './registry';
import { buildPlacementResult } from '@/lib/widgetPlacement';

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
  const { widgets, addWidgetWithLayout } = useWidgetStore();
  const t = useTranslations('Widgets');
  const [activeCategory, setActiveCategory] = useState<'all' | WidgetCategory>('all');

  const handleAddWidget = (type: string, defaultSize: { w: number; h: number }) => {
    const placement = buildPlacementResult({
      widgets,
      widgetType: type as any,
      widgetId: uuidv4(),
      defaultSize,
      cols: 8,
    });
    addWidgetWithLayout(placement.newWidget, placement.positionUpdates);
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
