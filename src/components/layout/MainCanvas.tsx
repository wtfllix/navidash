"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { widgetComponentRegistry } from '../widgets/registry';
import WidgetPicker from '../widgets/WidgetPicker';
import WidgetSettingsModal from '../widgets/WidgetSettingsModal';
import { Trash2, GripHorizontal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import DroppableGridArea from './DroppableGridArea';
import { buildMoveResult } from '@/lib/widgetPlacement';
import { WidgetDropPreviewDetail } from '@/lib/widgetPlacement';

const GRID_ROW_HEIGHT = 120;
const GRID_MARGIN: [number, number] = [8, 8];

/**
 * useContainerWidth Hook
 * 监听容器宽度变化，用于响应式网格布局
 * 使用 ResizeObserver 实现高性能监听
 */
const useContainerWidth = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { width, containerRef };
};

/**
 * WidgetItemContent Component
 * 小组件容器封装，处理编辑模式下的拖拽手柄和操作按钮
 */
const WidgetItemContent = React.memo(({
  widget,
  onEdit,
  onDragHandlePointerDown,
}: {
  widget: Widget;
  onEdit: (widget: Widget) => void;
  onDragHandlePointerDown: (widget: Widget, event: React.PointerEvent<HTMLDivElement>) => void;
}) => {
  const { removeWidget } = useWidgetStore();
  const { isEditing } = useUIStore();
  const t = useTranslations('Widgets');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const renderContent = () => {
    const Component = widgetComponentRegistry[widget.type];
    if (Component) return <Component widget={widget} />;
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-xs font-bold uppercase text-gray-400 mb-2">{widget.type}</span>
        <div className="text-gray-600 font-medium">{t('coming_soon')}</div>
      </div>
    );
  };

  const isTransparent = !isEditing && widget.type === 'clock' && ['analog', 'apple', 'flip'].includes(widget.config?.clockStyle || 'digital');

  return (
    <div className="w-full h-full relative group">
      {/* 编辑模式下的覆盖层：显示删除/设置按钮和拖拽手柄 */}
      {isEditing && (
        <>
          <div className="absolute top-2 right-2 flex space-x-1 z-20 animate-in fade-in zoom-in duration-200">
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEdit(widget); }}
              className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-full hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
              title={t('edit_widget')}
              aria-label={t('edit_widget')}
            >
              <Settings size={14} />
            </button>
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
              className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
              title={t('remove_widget')}
              aria-label={t('remove_widget')}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div
            className="absolute top-2 left-2 z-10 text-gray-600 cursor-grab active:cursor-grabbing draggable-handle bg-white/90 p-1.5 rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-150"
            aria-hidden="true"
            onPointerDown={(event) => onDragHandlePointerDown(widget, event)}
          >
             <GripHorizontal size={18} />
          </div>
        </>
      )}
      
      <div className={cn(
        "w-full h-full transition-all duration-300",
        isEditing 
          ? "overflow-hidden rounded-xl border border-blue-400 border-dashed ring-4 ring-blue-50 bg-gray-50/50 scale-[0.98]" 
          : isTransparent
            ? ""
            : "overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md"
      )}>
        <div className={cn("w-full h-full", isEditing && "pointer-events-none opacity-80 blur-[0.5px]")}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
});
WidgetItemContent.displayName = 'WidgetItemContent';

/**
 * MainCanvas Component
 * 主内容区域，基于 react-grid-layout 实现可拖拽、可缩放的网格布局
 */
export default function MainCanvas() {
  const { 
    backgroundImage, 
    backgroundBlur, 
    backgroundOpacity,
    backgroundSize,
    backgroundRepeat
  } = useSettingsStore();
  const { widgets, setWidgets } = useWidgetStore();
  const { isEditing, isWidgetPickerOpen, closeWidgetPicker } = useUIStore();
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [mounted, setMounted] = useState(false);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [dropPreviewUpdates, setDropPreviewUpdates] = useState<Array<{ id: string; position: { x: number; y: number } }>>([]);
  const [editPreviewUpdates, setEditPreviewUpdates] = useState<Array<{ id: string; position: { x: number; y: number } }>>([]);
  const dragPreviewRef = useRef<{ x: number; y: number } | null>(null);
  const widgetsRef = useRef(widgets);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    widgetId: string;
    startClientX: number;
    startClientY: number;
    startGridX: number;
    startGridY: number;
  } | null>(null);
  
  // 获取容器宽度以动态调整网格列数
  const { width, containerRef } = useContainerWidth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {
    const handlePreview = (event: CustomEvent<WidgetDropPreviewDetail>) => {
      if (!event.detail.active) {
        setDropPreviewUpdates([]);
        return;
      }
      setDropPreviewUpdates(event.detail.updates);
    };

    window.addEventListener('widget-drop-preview', handlePreview as EventListener);
    return () => window.removeEventListener('widget-drop-preview', handlePreview as EventListener);
  }, []);

  useEffect(() => {
    if (!isEditing) {
      dragStartRef.current = null;
      setDraggingWidgetId(null);
      setDragPreviewPosition(null);
      setEditPreviewUpdates([]);
      dragPreviewRef.current = null;
      pendingPointerRef.current = null;
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    }
  }, [isEditing]);


  // 根据容器宽度计算当前列数 (响应式断点)
  const currentCols = useMemo(() => {
    if (!width) return 8;
    if (width >= 1600) return 10;
    if (width >= 1200) return 8;
    if (width >= 900) return 6;
    if (width >= 600) return 4;
    return 2;
  }, [width]);

  const cellWidth = useMemo(() => {
    if (!width) return 0;
    return (width - (currentCols - 1) * GRID_MARGIN[0]) / currentCols;
  }, [width, currentCols]);

  const toPixelRect = useCallback((widget: Widget, overridePosition?: { x: number; y: number }) => {
    const position = overridePosition ?? widget.position;
    const left = position.x * (cellWidth + GRID_MARGIN[0]);
    const top = position.y * (GRID_ROW_HEIGHT + GRID_MARGIN[1]);
    const widthPx = cellWidth * widget.size.w + GRID_MARGIN[0] * (widget.size.w - 1);
    const heightPx = GRID_ROW_HEIGHT * widget.size.h + GRID_MARGIN[1] * (widget.size.h - 1);
    return { left, top, width: widthPx, height: heightPx };
  }, [cellWidth]);

  const canvasHeight = useMemo(() => {
    const bottoms = widgets.map((widget) => {
      const editPreview = editPreviewUpdates.find((item) => item.id === widget.id)?.position;
      const dropPreview = dropPreviewUpdates.find((item) => item.id === widget.id)?.position;
      const previewPos =
        dragPreviewPosition && draggingWidgetId === widget.id
          ? dragPreviewPosition
          : editPreview ?? dropPreview;
      const rect = toPixelRect(widget, previewPos);
      return rect.top + rect.height;
    });
    const maxBottom = bottoms.length > 0 ? Math.max(...bottoms) : 0;
    return Math.max(500, maxBottom + 16);
  }, [widgets, draggingWidgetId, dragPreviewPosition, editPreviewUpdates, dropPreviewUpdates, toPixelRect]);

  const handleDragHandlePointerDown = useCallback((widget: Widget, event: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditing || !cellWidth || dragStartRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    const flushPointerMove = () => {
      pointerFrameRef.current = null;
      const pending = pendingPointerRef.current;
      if (!pending || !dragStartRef.current) return;
      const moveEvent = pending;
      if (!dragStartRef.current) return;
      const drag = dragStartRef.current;
      const deltaX = moveEvent.x - drag.startClientX;
      const deltaY = moveEvent.y - drag.startClientY;

      const startLeft = drag.startGridX * (cellWidth + GRID_MARGIN[0]);
      const startTop = drag.startGridY * (GRID_ROW_HEIGHT + GRID_MARGIN[1]);
      const nextLeft = startLeft + deltaX;
      const nextTop = startTop + deltaY;

      const movingWidget = widgetsRef.current.find((item) => item.id === drag.widgetId);
      if (!movingWidget) return;

      const nextX = Math.max(
        0,
        Math.min(
          Math.round(nextLeft / (cellWidth + GRID_MARGIN[0])),
          currentCols - movingWidget.size.w
        )
      );
      const nextY = Math.max(0, Math.round(nextTop / (GRID_ROW_HEIGHT + GRID_MARGIN[1])));
      const prevPreview = dragPreviewRef.current;
      if (prevPreview && prevPreview.x === nextX && prevPreview.y === nextY) {
        return;
      }

      const previewLayout = buildMoveResult({
        widgets: widgetsRef.current,
        widgetId: drag.widgetId,
        cols: currentCols,
        preferredPosition: { x: nextX, y: nextY },
      });

      const movingPreview = previewLayout.widgets.find((item) => item.id === drag.widgetId)?.position ?? {
        x: nextX,
        y: nextY,
      };
      setDragPreviewPosition(movingPreview);
      dragPreviewRef.current = movingPreview;

      const previewUpdates = previewLayout.widgets
        .filter((item) => item.id !== drag.widgetId)
        .map((item) => {
          const original = widgetsRef.current.find((w) => w.id === item.id);
          return original &&
            (original.position.x !== item.position.x || original.position.y !== item.position.y)
            ? { id: item.id, position: item.position }
            : null;
        })
        .filter((item): item is { id: string; position: { x: number; y: number } } => !!item);
      setEditPreviewUpdates(previewUpdates);
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      pendingPointerRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      if (pointerFrameRef.current !== null) return;
      pointerFrameRef.current = window.requestAnimationFrame(flushPointerMove);
    };

    const onPointerUp = () => {
      const drag = dragStartRef.current;
      if (!drag) return;

      const preview = dragPreviewRef.current ?? { x: drag.startGridX, y: drag.startGridY };
      const moveResult = buildMoveResult({
        widgets: widgetsRef.current,
        widgetId: drag.widgetId,
        cols: currentCols,
        preferredPosition: preview,
      });

      if (moveResult.movedWidgetIds.length > 0) {
        setWidgets(moveResult.widgets);
      }

      dragStartRef.current = null;
      setDraggingWidgetId(null);
      setDragPreviewPosition(null);
      setEditPreviewUpdates([]);
      dragPreviewRef.current = null;
      pendingPointerRef.current = null;
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    dragStartRef.current = {
      widgetId: widget.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startGridX: widget.position.x,
      startGridY: widget.position.y,
    };
    setDraggingWidgetId(widget.id);
    setDragPreviewPosition(widget.position);
    setEditPreviewUpdates([]);
    dragPreviewRef.current = widget.position;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [isEditing, cellWidth, currentCols, setWidgets]);

  return (
    <main
      className="flex-1 relative flex flex-col overflow-hidden focus:outline-none"
      data-main-canvas
      tabIndex={-1}
    >
      <>
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: (backgroundImage && (backgroundImage.startsWith('http') || backgroundImage.startsWith('/') || backgroundImage.startsWith('data:')))
              ? `url(${backgroundImage})` 
              : (backgroundImage || 'radial-gradient(#d1d5db 2px, transparent 2px)'),
            backgroundSize: backgroundImage ? (backgroundSize || 'cover') : '24px 24px',
            backgroundRepeat: backgroundImage ? (backgroundRepeat || 'no-repeat') : 'repeat',
            backgroundPosition: 'center',
            filter: `blur(${backgroundBlur}px)`,
          }}
        />
        <div 
          className="absolute inset-0 z-0 pointer-events-none bg-black"
          style={{ opacity: backgroundOpacity }}
        />
      </>

      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <div ref={containerRef} className="max-w-7xl mx-auto min-h-[500px]">
         {mounted && width > 0 && (
           <DroppableGridArea
             containerRef={containerRef}
             width={width}
             cols={currentCols}
             rowHeight={GRID_ROW_HEIGHT}
             margin={GRID_MARGIN}
           >
             <div className="relative w-full" style={{ height: `${canvasHeight}px` }}>
               {widgets.map((widget) => {
                 const editPreview = editPreviewUpdates.find((item) => item.id === widget.id)?.position;
                 const dropPreview = dropPreviewUpdates.find((item) => item.id === widget.id)?.position;
                 const previewPos =
                   dragPreviewPosition && draggingWidgetId === widget.id
                     ? dragPreviewPosition
                     : editPreview ?? dropPreview;
                 const rect = toPixelRect(widget, previewPos);
                 const isDraggingThis = draggingWidgetId === widget.id;
                 const isBeingPushed = (!!editPreview || !!dropPreview) && !isDraggingThis;

                 return (
                   <div
                     key={widget.id}
                     className={cn(
                       "absolute transition-[left,top,width,height,transform,filter]",
                       isDraggingThis
                         ? "duration-100 ease-linear"
                         : isBeingPushed
                           ? "duration-430 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
                           : "duration-260 ease-out",
                       isDraggingThis && "z-30 scale-[1.02] drop-shadow-xl"
                     )}
                     style={{
                       left: `${rect.left}px`,
                       top: `${rect.top}px`,
                       width: `${rect.width}px`,
                       height: `${rect.height}px`,
                     }}
                   >
                     <WidgetItemContent
                       widget={widget}
                       onEdit={setEditingWidget}
                       onDragHandlePointerDown={handleDragHandlePointerDown}
                     />
                   </div>
                 );
               })}
             </div>
           </DroppableGridArea>
         )}

         {/* Add Widget Button moved to Header */}
        </div>
      </div>
      
      <WidgetPicker 
        isOpen={isWidgetPickerOpen} 
        onClose={closeWidgetPicker} 
      />
      <WidgetSettingsModal 
        isOpen={!!editingWidget} 
        widget={editingWidget} 
        onClose={() => setEditingWidget(null)} 
      />
    </main>
  );
}
