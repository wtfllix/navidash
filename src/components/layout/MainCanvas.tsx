'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import WidgetPicker from '../widgets/WidgetPicker';
import WidgetSettingsModal from '../widgets/WidgetSettingsModal';
import DroppableGridArea from './DroppableGridArea';
import { WidgetCreatedDetail, WidgetDropPreviewDetail } from '@/lib/widgetPlacement';
import { useCanvasMetrics } from './useCanvasMetrics';
import { useCanvasDragPreview } from './useCanvasDragPreview';
import { useCanvasLayoutItems } from './useCanvasLayoutItems';
import MainCanvasBackground from './MainCanvasBackground';
import CanvasWidgetItem from './CanvasWidgetItem';
import WidgetDeleteZone from './WidgetDeleteZone';
import { useDragDrop } from './DragDropProvider';

const GRID_ROW_HEIGHT = 120;
const GRID_MARGIN: [number, number] = [8, 8];

/**
 * MainCanvas Component
 * 主内容区域，负责组合画布背景、放置网格与 widget 视图层。
 */
export default function MainCanvas() {
  const {
    backgroundImage,
    backgroundBlur,
    backgroundOpacity,
    backgroundSize,
    backgroundRepeat,
  } = useSettingsStore();
  const { widgets, setWidgets, removeWidget } = useWidgetStore();
  const { isEditing, isWidgetPickerOpen, closeWidgetPicker, setCurrentCanvasCols } = useUIStore();
  const { isDragging: isStoreDragging } = useDragDrop();

  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [mounted, setMounted] = useState(false);
  const widgetsRef = useRef(widgets);
  const [dropPreviewUpdates, setDropPreviewUpdates] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);

  const { width, containerRef, currentCols, cellWidth, toPixelRect } = useCanvasMetrics({
    rowHeight: GRID_ROW_HEIGHT,
    margin: GRID_MARGIN,
  });

  const {
    handleDragHandlePointerDown,
    draggingWidgetId,
    dragPreviewPosition,
    dragPointerOffset,
    editPreviewUpdates,
  } = useCanvasDragPreview({
    widgets,
    isEditing,
    cellWidth,
    currentCols,
    rowHeight: GRID_ROW_HEIGHT,
    margin: GRID_MARGIN,
    setWidgets,
  });

  const { items: canvasItems, canvasHeight } = useCanvasLayoutItems({
    widgets,
    draggingWidgetId,
    dragPreviewPosition,
    dragPointerOffset,
    editPreviewUpdates,
    dropPreviewUpdates,
    toPixelRect,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {
    setCurrentCanvasCols(currentCols);
  }, [currentCols, setCurrentCanvasCols]);

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
    const handleCreated = (event: CustomEvent<WidgetCreatedDetail>) => {
      if (!event.detail.shouldOpenSettings) return;

      requestAnimationFrame(() => {
        const targetWidget = widgetsRef.current.find((widget) => widget.id === event.detail.widgetId);
        if (targetWidget) {
          setEditingWidget(targetWidget);
        }
      });
    };

    window.addEventListener('widget-created', handleCreated as EventListener);
    return () => window.removeEventListener('widget-created', handleCreated as EventListener);
  }, []);

  return (
    <main
      className="flex-1 relative flex flex-col overflow-hidden focus:outline-none"
      data-main-canvas
      tabIndex={-1}
    >
      <MainCanvasBackground
        backgroundImage={backgroundImage}
        backgroundBlur={backgroundBlur}
        backgroundOpacity={backgroundOpacity}
        backgroundSize={backgroundSize}
        backgroundRepeat={backgroundRepeat}
      />

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
                {canvasItems.map(
                  ({
                    widget,
                    rect,
                    layoutRect,
                    dragOffset,
                    hasPreviewTarget,
                    isDragging,
                    isBeingPushed,
                  }) => (
                  <CanvasWidgetItem
                    key={widget.id}
                    widget={widget}
                    rect={rect}
                    layoutRect={layoutRect}
                    dragOffset={dragOffset}
                    hasPreviewTarget={hasPreviewTarget}
                    isDragging={isDragging}
                    isBeingPushed={isBeingPushed}
                    onEdit={setEditingWidget}
                    onDragHandlePointerDown={handleDragHandlePointerDown}
                  />
                  )
                )}
              </div>
            </DroppableGridArea>
          )}
        </div>
      </div>

      <WidgetPicker isOpen={isWidgetPickerOpen} onClose={closeWidgetPicker} />
      <WidgetDeleteZone
        visible={isStoreDragging}
      />
      <WidgetSettingsModal
        isOpen={!!editingWidget}
        widget={editingWidget}
        onClose={() => setEditingWidget(null)}
      />
    </main>
  );
}
