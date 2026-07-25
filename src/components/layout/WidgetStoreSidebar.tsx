'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { v4 as uuidv4 } from 'uuid';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { buildPlacementResult, WidgetCreatedDetail } from '@/lib/widgetPlacement';
import { widgetMeta, widgetTypesRequiringSetup } from '@/components/widgets/registry';
import DraggableWidgetItem from './DraggableWidgetItem';
import { isClientDemoMode } from '@/lib/demo';

export default function WidgetStoreSidebar() {
  const { widgets, addWidgetWithLayout } = useWidgetStore();
  const currentCanvasCols = useUIStore((state) => state.currentCanvasCols);
  const closeWidgetStore = useSidebarStore((state) => state.close);
  const t = useTranslations('Widgets');
  const [searchQuery, setSearchQuery] = useState('');
  const isDemoMode = isClientDemoMode;

  const handleAddWidget = (type: string, defaultSize: { w: number; h: number }) => {
    const placement = buildPlacementResult({
      widgets,
      widgetType: type as any,
      widgetId: uuidv4(),
      defaultSize,
      cols: currentCanvasCols,
    });

    if (
      !placement.isValid ||
      !addWidgetWithLayout(placement.newWidget, placement.positionUpdates)
    ) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent<WidgetCreatedDetail>('widget-created', {
        detail: {
          widgetId: placement.newWidget.id,
          shouldOpenSettings: widgetTypesRequiringSetup.includes(placement.newWidget.type),
        },
      })
    );
    closeWidgetStore();
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
    <div className="flex h-full min-h-0 flex-col bg-white/70">
      <div className="flex shrink-0 items-center gap-3 px-4 py-2">
        <div className="relative w-full max-w-sm">
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
            className="w-full rounded-xl border border-slate-200/80 bg-white/88 py-2 pl-9 pr-8 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-[rgba(var(--primary-color),0.4)] focus:ring-4 focus:ring-[rgba(var(--primary-color),0.12)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('search_widgets')}
          />
        </div>
        {isDemoMode && (
          <span className="hidden shrink-0 text-xs text-amber-700 sm:inline">
            Demo 刷新后恢复
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 scrollbar-hide">
        {filteredWidgets.length > 0 ? (
          <div className="flex w-max gap-3 pt-1">
            {filteredWidgets.map((meta) => (
              <DraggableWidgetItem
                key={meta.type}
                meta={meta}
                compact
                onClick={() => handleAddWidget(meta.type, meta.defaultSize)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
            <Search size={18} className="text-slate-400" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">{t('empty_state_title')}</p>
              <p className="mt-1 text-xs text-slate-500">
              {searchQuery.trim() ? t('no_search_results') : t('no_widgets')}
              </p>
            </div>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
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
