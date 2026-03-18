'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { v4 as uuidv4 } from 'uuid';
import { canPlaceWidget } from '@/lib/layoutEngine';
import { buildPlacementResult, WidgetDropDetail } from '@/lib/widgetPlacement';

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
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState | null>(null);
  const dropIndicatorRef = useRef<HTMLDivElement>(null);
  const dropIndicatorRefLatest = useRef(dropIndicator);
  const widgetsRef = useRef(widgets);

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
    widgetHeight: number
  ) => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const { cellWidth } = cellDimensions;
    const cellHeightWithMargin = rowHeight + margin[1];

    // 计算网格位置
    let gridX = Math.floor(relativeX / (cellWidth + margin[0]));
    let gridY = Math.floor(relativeY / cellHeightWithMargin);

    // 限制在网格范围内
    gridX = Math.max(0, Math.min(gridX, cols - widgetWidth));
    gridY = Math.max(0, gridY);

    return { x: gridX, y: gridY };
  }, [containerRef, cols, cellDimensions, rowHeight, margin]);

  // 获取 DnD 上下文
  const dndContext = useDndContext();
  const { active } = dndContext;
  const isDragging = !!active;

  // 可放置区域配置
  const { setNodeRef, isOver } = useDroppable({
    id: 'main-canvas-drop-area',
    data: {
      type: 'grid-drop-area',
    },
  });

  // 处理拖拽移动，更新放置指示器
  useEffect(() => {
    if (!isOver || !containerRef.current || !active) {
      setDropIndicator(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;

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

      const position = calculateGridPosition(e.clientX, e.clientY, widgetWidth, widgetHeight);
      if (position) {
        // 检查是否可以直接放置
        const canPlace = canPlaceWidget(
          widgetsRef.current,
          position.x,
          position.y,
          widgetWidth,
          widgetHeight
        );

        // 如果需要推动，计算哪些组件会被推动
        let willPushWidgets: string[] = [];
        if (!canPlace) {
          willPushWidgets = buildPlacementResult({
            widgets: widgetsRef.current,
            widgetType: activeWidgetType as any,
            widgetId: 'temp',
            defaultSize: { w: widgetWidth, h: widgetHeight },
            cols,
            preferredPosition: { x: position.x, y: position.y },
          }).movedWidgetIds;
        }

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
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [isOver, active, calculateGridPosition, containerRef, cols]);

  // 处理放置事件
  useEffect(() => {
    const handleDrop = (e: CustomEvent<WidgetDropDetail>) => {
      const { widgetType, defaultSize, dropClient } = e.detail;

      if (!containerRef.current) return;

      const currentDropIndicator = dropIndicatorRefLatest.current;
      
      let position;
      if (dropClient) {
        position = calculateGridPosition(dropClient.x, dropClient.y, defaultSize.w, defaultSize.h);
      } else if (currentDropIndicator) {
        position = { x: currentDropIndicator.x, y: currentDropIndicator.y };
      } else {
        // 如果没有 dropIndicator，回退到中心点放置
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + width / 2;
        const centerY = rect.top + 100;
        position = calculateGridPosition(centerX, centerY, defaultSize.w, defaultSize.h);
      }

      if (!position) {
        setDropIndicator(null);
        return;
      }

      const placement = buildPlacementResult({
        widgets: widgetsRef.current,
        widgetType: widgetType as any,
        widgetId: uuidv4(),
        defaultSize,
        cols,
        preferredPosition: position,
      });

      // 原子操作：添加新组件并更新现有组件位置
      addWidgetWithLayout(placement.newWidget, placement.positionUpdates);
      closeSidebar();
      // 焦点切换到主面板，便于继续键盘/交互操作
      requestAnimationFrame(() => {
        const mainCanvas = document.querySelector('[data-main-canvas]');
        if (mainCanvas instanceof HTMLElement) {
          mainCanvas.focus();
        }
      });

      setDropIndicator(null);
    };

    window.addEventListener('widget-drop', handleDrop as EventListener);
    return () => window.removeEventListener('widget-drop', handleDrop as EventListener);
  }, [width, cols, addWidgetWithLayout, calculateGridPosition, containerRef, closeSidebar]);

  // 清除指示器当拖拽结束
  useEffect(() => {
    if (!isDragging) {
      setDropIndicator(null);
    }
  }, [isDragging]);

  return (
    <div className="relative w-full h-full">
      {/* 可放置区域覆盖层 */}
      <div
        ref={setNodeRef}
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: isDragging ? 'auto' : 'none',
          backgroundColor: isOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          border: isOver ? '2px dashed rgba(59, 130, 246, 0.3)' : 'none',
          borderRadius: '0.75rem',
        }}
      />

      {/* 放置指示器 */}
      {dropIndicator?.visible && (
        <div
          ref={dropIndicatorRef}
          className={`
            absolute z-20 pointer-events-none border-2 rounded-lg transition-all duration-150
            ${dropIndicator.isValid 
              ? 'border-blue-500 bg-blue-100/30' 
              : 'border-orange-500 bg-orange-100/40'
            }
          `}
          style={{
            left: `${dropIndicator.x * (cellDimensions.cellWidth + margin[0])}px`,
            top: `${dropIndicator.y * (rowHeight + margin[1])}px`,
            width: `${cellDimensions.cellWidth * dropIndicator.w + margin[0] * (dropIndicator.w - 1)}px`,
            height: `${dropIndicator.h * rowHeight + (dropIndicator.h - 1) * margin[1]}px`,
          }}
        >
          {/* 推动提示 */}
          {!dropIndicator.isValid && dropIndicator.willPushWidgets.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-orange-700 bg-white/90 px-2 py-1 rounded shadow-sm">
                将推动 {dropIndicator.willPushWidgets.length} 个组件
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
