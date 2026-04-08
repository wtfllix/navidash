'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { v4 as uuidv4 } from 'uuid';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { buildPlacementResult, WidgetCreatedDetail } from '@/lib/widgetPlacement';
import { widgetMeta, widgetTypesRequiringSetup } from '@/components/widgets/registry';
import DraggableWidgetItem from './DraggableWidgetItem';
import { isClientDemoMode } from '@/lib/demo';

export default function WidgetStoreSidebar() {
  const { widgets, addWidgetWithLayout } = useWidgetStore();
  const currentCanvasCols = useUIStore((state) => state.currentCanvasCols);
  const t = useTranslations('Widgets');
  const [searchQuery, setSearchQuery] = useState('');
  const isDemoMode = isClientDemoMode;

  const handleAddWidget = (type: string, defaultSize: { w: number; h: number }) => {
    if (isDemoMode) {
      return;
    }

    const placement = buildPlacementResult({
      widgets,
      widgetType: type as any,
      widgetId: uuidv4(),
      defaultSize,
      cols: currentCanvasCols,
    });

    addWidgetWithLayout(placement.newWidget, placement.positionUpdates);
    window.dispatchEvent(
      new CustomEvent<WidgetCreatedDetail>('widget-created', {
        detail: {
          widgetId: placement.newWidget.id,
          shouldOpenSettings: widgetTypesRequiringSetup.includes(placement.newWidget.type),
        },
      })
    );
  };

  const filteredWidgets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return widgetMeta;

    return widgetMeta.filter(
      (meta) =>
        t(meta.titleKey as any).toLowerCase().includes(query) ||
        t(meta.descKey as any).toLowerCase().includes(query)
    );
  }, [searchQuery, t]);

  return (
    <div className="flex h-full flex-col bg-white/92">
      <div className="shrink-0 border-b border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <h2 className="text-base font-semibold tracking-[0.01em] text-slate-900">
          {t('store_title')}
        </h2>

        {isDemoMode && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            当前为只读 demo，组件库仅用于预览，不支持拖拽添加。
          </p>
        )}

        <div className="relative mt-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              aria-label={t('clear_search')}
            >
              <X size={12} />
            </button>
          )}
          <input
            type="text"
            placeholder={t('search_widgets')}
            className="w-full rounded-xl border border-white/70 bg-white/80 py-2.5 pl-9 pr-8 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-slate-300 focus:ring-4 focus:ring-[rgba(var(--primary-color),0.12)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('search_widgets')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        {filteredWidgets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 pt-3">
            {filteredWidgets.map((meta) => (
              <DraggableWidgetItem
                key={meta.type}
                meta={meta}
                disabled={isDemoMode}
                onClick={() => handleAddWidget(meta.type, meta.defaultSize)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <Search size={18} className="text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">{t('empty_state_title')}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {searchQuery.trim() ? t('no_search_results') : t('no_widgets')}
            </p>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                {t('clear_search')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
