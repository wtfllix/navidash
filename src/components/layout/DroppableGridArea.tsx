'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { v4 as uuidv4 } from 'uuid';
import { canPlaceWidget } from '@/lib/layoutEngine';
import { buildPlacementResult, WidgetCreatedDetail, WidgetDropDetail, WidgetDropPreviewDetail } from '@/lib/widgetPlacement';
import { useTranslations } from 'next-intl';
import { widgetMeta, widgetTypesRequiringSetup } from '@/components/widgets/registry';

interface DroppableGridAreaProps {
  containerRef: React.RefObject<HTMLDivElement>;
  width: number;
  cols: number;
  rowHeight: number;
  margin: [number, number];
  children: React.ReactNode;
}

/**
 * 放置指示器状态
 */
interface DropIndicatorState {
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  isValid: boolean; // true: 可以直接放置, false: 需要推动其他组件
  willPushWidgets: string[]; // 将被推动的组件ID列表
}

/**
 * DroppableGridArea
 * 可放置的网格区域，覆盖在 MainCanvas 的网格上方
 * 
 * 功能特性：
 * 1. 实时显示放置指示器，根据组件实际尺寸动态调整
 * 2. 智能布局：放置时自动推动现有组件腾出空间
 * 3. 视觉反馈：蓝色=直接放置，橙色=需要推动组件
 * 4. 动画支持：组件位置变化时有平滑过渡
 */
export default function DroppableGridArea({
  containerRef,
  width,
  cols,
  rowHeight,
  margin,
  children,
}: DroppableGridAreaProps) {
  const { widgets, addWidgetWithLayout } = useWidgetStore();
  const { close: closeSidebar } = useSidebarStore();
  const t = useTranslations('Widgets');
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState | null>(null);
  const dropIndicatorRef = useRef<HTMLDivElement>(null);
  const dropIndicatorRefLatest = useRef(dropIndicator);
  const widgetsRef = useRef(widgets);

  const dispatchPreview = useCallback((detail: WidgetDropPreviewDetail) => {
    window.dispatchEvent(new CustomEvent<WidgetDropPreviewDetail>('widget-drop-preview', { detail }));
  }, []);

  // 同步 widgets 到 ref，避免在事件监听中形成闭包
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  // 同步 dropIndicator 到 ref
  useEffect(() => {
    dropIndicatorRefLatest.current = dropIndicator;
  }, [dropIndicator]);

  // 计算单元格尺寸
  const cellDimensions = useMemo(() => {
    const cellWidth = (width - (cols - 1) * margin[0]) / cols;
    const cellHeight = rowHeight;
    return { cellWidth, cellHeight };
  }, [width, cols, rowHeight, margin]);

  // 计算网格位置
  const calculateGridPosition = useCallback((
    clientX: number,
    clientY: number,
    widgetWidth: number,
    widgetHeight: number,
    anchor: 'top-left' | 'center' = 'top-left'
  ) => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const { cellWidth } = cellDimensions;
    const cellHeightWithMargin = rowHeight + margin[1];
    const widgetPixelWidth =
      cellWidth * widgetWidth + margin[0] * (widgetWidth - 1);
    const widgetPixelHeight =
      rowHeight * widgetHeight + margin[1] * (widgetHeight - 1);

    let relativeX = clientX - rect.left;
    let relativeY = clientY - rect.top;
    if (anchor === 'center') {
      // 以鼠标点为组件中心进行计算，避免“左上角吸附”体感
      relativeX -= widgetPixelWidth / 2;
      relativeY -= widgetPixelHeight / 2;
    }

    // 计算网格位置：就近吸附，减少明显偏左/偏上
    let gridX = Math.round(relativeX / (cellWidth + margin[0]));
    let gridY = Math.round(relativeY / cellHeightWithMargin);

    // 限制在网格范围内
    gridX = Math.max(0, Math.min(gridX, cols - widgetWidth));
    gridY = Math.max(0, gridY);

    return { x: gridX, y: gridY };
  }, [containerRef, cols, cellDimensions, rowHeight, margin]);

  // 获取 DnD 上下文
  const dndContext = useDndContext();
  const { active } = dndContext;
  const isDragging = !!active;
  const activeMeta = useMemo(() => {
    const activeType = active?.data.current?.type;
    return widgetMeta.find((item) => item.type === activeType);
  }, [active]);

  // 可放置区域配置
  const { setNodeRef } = useDroppable({
    id: 'main-canvas-drop-area',
    data: {
      type: 'grid-drop-area',
    },
  });

  // 处理拖拽移动，更新放置指示器
  useEffect(() => {
    if (!containerRef.current || !active) {
      setDropIndicator(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isInsideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!isInsideCanvas) {
        setDropIndicator(null);
        dispatchPreview({ active: false, updates: [] });
        return;
      }

      // 从 active 数据获取 widget 尺寸
      let widgetWidth = 2;
      let widgetHeight = 1;
      let activeWidgetType: string = 'clock';

      if (active?.data.current) {
        const data = active.data.current as any;
        if (data.defaultSize) {
          widgetWidth = data.defaultSize.w;
          widgetHeight = data.defaultSize.h;
        }
        if (typeof data.type === 'string') {
          activeWidgetType = data.type;
        }
      }

      const position = calculateGridPosition(
        e.clientX,
        e.clientY,
        widgetWidth,
        widgetHeight,
        'center'
      );
      if (position) {
        // 检查是否可以直接放置
        const canPlace = canPlaceWidget(
          widgetsRef.current,
          position.x,
          position.y,
          widgetWidth,
          widgetHeight
        );

        const previewPlacement = buildPlacementResult({
          widgets: widgetsRef.current,
          widgetType: activeWidgetType as any,
          widgetId: 'temp-preview',
          defaultSize: { w: widgetWidth, h: widgetHeight },
          cols,
          preferredPosition: { x: position.x, y: position.y },
        });
        const willPushWidgets = canPlace ? [] : previewPlacement.movedWidgetIds;
        dispatchPreview({
          active: true,
          updates: previewPlacement.positionUpdates,
        });

        setDropIndicator({
          x: position.x,
          y: position.y,
          w: widgetWidth,
          h: widgetHeight,
          visible: true,
          isValid: canPlace,
          willPushWidgets,
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      dispatchPreview({ active: false, updates: [] });
    };
  }, [active, calculateGridPosition, containerRef, cols, dispatchPreview]);

  // 处理放置事件
  useEffect(() => {
    const handleDrop = (e: CustomEvent<WidgetDropDetail>) => {
      const { widgetType, defaultSize, dropClient, droppedOnGrid } = e.detail;

      if (!containerRef.current) return;

      const currentDropIndicator = dropIndicatorRefLatest.current;

      let position: { x: number; y: number } | undefined;
      const isDropClientInsideCanvas =
        !!dropClient &&
        (() => {
          const rect = containerRef.current!.getBoundingClientRect();
          return (
            dropClient.x >= rect.left &&
            dropClient.x <= rect.right &&
            dropClient.y >= rect.top &&
            dropClient.y <= rect.bottom
          );
        })();
      const shouldUsePreferredPosition =
        droppedOnGrid || isDropClientInsideCanvas || !!currentDropIndicator;

      // 优先使用实时指示器，保证落位与视觉反馈一致
      if (shouldUsePreferredPosition && currentDropIndicator) {
        position = { x: currentDropIndicator.x, y: currentDropIndicator.y };
      } else if (shouldUsePreferredPosition && dropClient) {
        position = calculateGridPosition(
          dropClient.x,
          dropClient.y,
          defaultSize.w,
          defaultSize.h,
          'center'
        ) ?? undefined;
      }
      // 未命中网格或无法确定目标点时，回退为末尾空白位

      const placement = buildPlacementResult({
        widgets: widgetsRef.current,
        widgetType: widgetType as any,
        widgetId: uuidv4(),
        defaultSize,
        cols,
        preferredPosition: position,
        maxScanRows: shouldUsePreferredPosition ? 20 : 0,
      });

      // 原子操作：添加新组件并更新现有组件位置
      addWidgetWithLayout(placement.newWidget, placement.positionUpdates);
      window.dispatchEvent(
        new CustomEvent<WidgetCreatedDetail>('widget-created', {
          detail: {
            widgetId: placement.newWidget.id,
            shouldOpenSettings: widgetTypesRequiringSetup.includes(placement.newWidget.type),
          },
        })
      );
      closeSidebar();
      // 焦点切换到主面板，便于继续键盘/交互操作
      requestAnimationFrame(() => {
        const mainCanvas = document.querySelector('[data-main-canvas]');
        if (mainCanvas instanceof HTMLElement) {
          mainCanvas.focus();
        }
      });

      setDropIndicator(null);
      dispatchPreview({ active: false, updates: [] });
    };

    window.addEventListener('widget-drop', handleDrop as EventListener);
    return () => window.removeEventListener('widget-drop', handleDrop as EventListener);
  }, [width, cols, addWidgetWithLayout, calculateGridPosition, containerRef, closeSidebar, dispatchPreview]);

  // 清除指示器当拖拽结束
  useEffect(() => {
    if (!isDragging) {
      setDropIndicator(null);
      dispatchPreview({ active: false, updates: [] });
    }
  }, [isDragging, dispatchPreview]);

  return (
    <div className="relative w-full h-full">
      {/* 可放置区域覆盖层 */}
      <div
        ref={setNodeRef}
        data-grid-drop-area="true"
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: isDragging ? 'auto' : 'none',
          backgroundColor: dropIndicator?.visible ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
          border: dropIndicator?.visible ? '1px dashed rgba(59, 130, 246, 0.2)' : 'none',
          borderRadius: '0.75rem',
        }}
      />

      {/* 放置指示器 */}
      {dropIndicator?.visible && (
        <div
          ref={dropIndicatorRef}
          className="absolute z-20 pointer-events-none transition-all duration-150"
          style={{
            left: `${dropIndicator.x * (cellDimensions.cellWidth + margin[0])}px`,
            top: `${dropIndicator.y * (rowHeight + margin[1])}px`,
            width: `${cellDimensions.cellWidth * dropIndicator.w + margin[0] * (dropIndicator.w - 1)}px`,
            height: `${dropIndicator.h * rowHeight + (dropIndicator.h - 1) * margin[1]}px`,
          }}
        >
          <div
            className={`
              relative h-full w-full overflow-hidden rounded-[22px] border shadow-[0_18px_45px_rgba(15,23,42,0.14)] ring-4 backdrop-blur-sm
              ${dropIndicator.isValid
                ? 'border-blue-300/80 bg-white/82 ring-blue-100/80'
                : 'border-orange-300/90 bg-white/84 ring-orange-100/90'
              }
            `}
          >
            <div
              className={`
                absolute inset-0
                ${dropIndicator.isValid
                  ? 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_45%)]'
                  : 'bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_48%)]'
                }
              `}
            />
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/90 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {t('widget_preview')}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {activeMeta ? t(activeMeta.titleKey as never) : t('add_widget_title')}
                  </div>
                </div>
                <div className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/80">
                  {dropIndicator.w} × {dropIndicator.h}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/80 bg-white/88 px-3 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    {activeMeta && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200/80">
                        <activeMeta.Icon size={18} className={activeMeta.iconClassName} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-2.5 w-2/3 rounded-full bg-slate-200/90" />
                      <div className="h-2 w-1/2 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>

                {(dropIndicator.h > 1 || dropIndicator.w > 1) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 rounded-2xl bg-white/62 ring-1 ring-white/80" />
                    <div className="h-12 rounded-2xl bg-white/50 ring-1 ring-white/70" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 推动提示 */}
          {!dropIndicator.isValid && dropIndicator.willPushWidgets.length > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-orange-700 shadow-sm ring-1 ring-orange-100">
                {t('push_widgets_hint', { count: dropIndicator.willPushWidgets.length })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 原始内容 */}
      {children}
    </div>
  );
}
