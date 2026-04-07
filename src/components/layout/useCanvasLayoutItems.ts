'use client';

import { useMemo } from 'react';
import { Widget } from '@/types';

interface PositionUpdate {
  id: string;
  position: { x: number; y: number };
}

interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface UseCanvasLayoutItemsOptions {
  widgets: Widget[];
  draggingWidgetId: string | null;
  dragPreviewPosition: { x: number; y: number } | null;
  dragPointerOffset: { x: number; y: number } | null;
  editPreviewUpdates: PositionUpdate[];
  dropPreviewUpdates: PositionUpdate[];
  toPixelRect: (widget: Widget, overridePosition?: { x: number; y: number }) => PixelRect;
}

export function useCanvasLayoutItems({
  widgets,
  draggingWidgetId,
  dragPreviewPosition,
  dragPointerOffset,
  editPreviewUpdates,
  dropPreviewUpdates,
  toPixelRect,
}: UseCanvasLayoutItemsOptions) {
  return useMemo(() => {
    const editPreviewMap = new Map(
      editPreviewUpdates.map((item) => [item.id, item.position] as const)
    );
    const dropPreviewMap = new Map(
      dropPreviewUpdates.map((item) => [item.id, item.position] as const)
    );

    const items = widgets.map((widget) => {
      const isDragging = draggingWidgetId === widget.id;
      const editPreview = editPreviewMap.get(widget.id);
      const dropPreview = dropPreviewMap.get(widget.id);
      const previewPos =
        dragPreviewPosition && isDragging
          ? dragPreviewPosition
          : editPreview ?? dropPreview;
      const layoutRect = toPixelRect(widget, previewPos);
      const displayRect = isDragging ? toPixelRect(widget) : layoutRect;
      const isBeingPushed = (!!editPreview || !!dropPreview) && !isDragging;

      return {
        widget,
        rect: displayRect,
        layoutRect,
        hasPreviewTarget:
          isDragging &&
          (displayRect.left !== layoutRect.left || displayRect.top !== layoutRect.top),
        isDragging,
        isBeingPushed,
        dragOffset: isDragging ? dragPointerOffset : null,
      };
    });

    const maxBottom =
      items.length > 0
        ? Math.max(...items.map((item) => item.layoutRect.top + item.layoutRect.height))
        : 0;

    return {
      items,
      canvasHeight: Math.max(500, maxBottom + 16),
    };
  }, [
    widgets,
    draggingWidgetId,
    dragPreviewPosition,
    dragPointerOffset,
    editPreviewUpdates,
    dropPreviewUpdates,
    toPixelRect,
  ]);
}
