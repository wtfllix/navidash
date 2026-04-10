'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Widget } from '@/types';
import { buildMoveResult, MoveResult } from '@/lib/widgetPlacement';

interface PositionUpdate {
  id: string;
  position: { x: number; y: number };
}

interface UseCanvasDragPreviewOptions {
  widgets: Widget[];
  isEditing: boolean;
  cellWidth: number;
  currentCols: number;
  rowHeight: number;
  margin: [number, number];
  batchUpdatePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

const AUTO_SCROLL_EDGE_THRESHOLD = 72;
const AUTO_SCROLL_MAX_SPEED = 18;

function getScrollTop(element: HTMLElement | Window | null | undefined) {
  if (!element) return 0;
  return element instanceof Window ? element.scrollY : element.scrollTop;
}

function scrollByDelta(element: HTMLElement | Window | null | undefined, deltaY: number) {
  if (!element || deltaY === 0) return;

  if (element instanceof Window) {
    element.scrollBy({ top: deltaY, behavior: 'auto' });
    return;
  }

  element.scrollTop += deltaY;
}

function getViewportRect(element: HTMLElement | Window | null | undefined) {
  if (!element || element instanceof Window) {
    return {
      top: 0,
      bottom: window.innerHeight,
    };
  }

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    bottom: rect.bottom,
  };
}

function arePositionsEqual(
  a: { x: number; y: number } | null,
  b: { x: number; y: number } | null
) {
  return a?.x === b?.x && a?.y === b?.y;
}

function arePositionUpdatesEqual(a: PositionUpdate[], b: PositionUpdate[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((update, index) => {
    const other = b[index];
    return (
      update.id === other?.id &&
      update.position.x === other.position.x &&
      update.position.y === other.position.y
    );
  });
}

export function useCanvasDragPreview({
  widgets,
  isEditing,
  cellWidth,
  currentCols,
  rowHeight,
  margin,
  batchUpdatePositions,
  scrollContainerRef,
}: UseCanvasDragPreviewOptions) {
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragPointerOffset, setDragPointerOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [editPreviewUpdates, setEditPreviewUpdates] = useState<PositionUpdate[]>([]);

  const dragPreviewRef = useRef<{ x: number; y: number } | null>(null);
  const widgetsRef = useRef(widgets);
  const dragPointerOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const editPreviewUpdatesRef = useRef<PositionUpdate[]>([]);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveResultRef = useRef<{
    preferredPosition: { x: number; y: number };
    result: MoveResult;
  } | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const activeScrollContainerRef = useRef<HTMLElement | Window | null>(null);
  const dragStartRef = useRef<{
    widgetId: string;
    startClientX: number;
    startClientY: number;
    startGridX: number;
    startGridY: number;
    startScrollTop: number;
    pointerId: number;
    handleElement: HTMLDivElement | null;
  } | null>(null);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  const resetDragState = useCallback(() => {
    const drag = dragStartRef.current;
    if (drag?.handleElement?.hasPointerCapture?.(drag.pointerId)) {
      drag.handleElement.releasePointerCapture(drag.pointerId);
    }

    dragStartRef.current = null;
    setDraggingWidgetId(null);
    setDragPreviewPosition(null);
    setDragPointerOffset(null);
    dragPointerOffsetRef.current = null;
    setEditPreviewUpdates([]);
    editPreviewUpdatesRef.current = [];
    dragPreviewRef.current = null;
    pendingPointerRef.current = null;
    lastMoveResultRef.current = null;

    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }

    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }

    activeScrollContainerRef.current = null;
  }, []);

  useEffect(() => {
    if (!isEditing) {
      resetDragState();
    }
  }, [isEditing, resetDragState]);

  useEffect(() => resetDragState, [resetDragState]);

  const handleDragHandlePointerDown = useCallback(
    (widget: Widget, event: React.PointerEvent<HTMLDivElement>) => {
      if (!isEditing || !cellWidth || dragStartRef.current) return;
      event.preventDefault();
      event.stopPropagation();

      const flushPointerMove = () => {
        pointerFrameRef.current = null;
        const pending = pendingPointerRef.current;
        if (!pending || !dragStartRef.current) return;
        const drag = dragStartRef.current;
        const deltaX = pending.x - drag.startClientX;
        const currentScrollTop = getScrollTop(activeScrollContainerRef.current);
        const deltaY = pending.y - drag.startClientY + (currentScrollTop - drag.startScrollTop);
        const nextOffset = { x: deltaX, y: deltaY };
        if (!arePositionsEqual(dragPointerOffsetRef.current, nextOffset)) {
          dragPointerOffsetRef.current = nextOffset;
          setDragPointerOffset(nextOffset);
        }

        const startLeft = drag.startGridX * (cellWidth + margin[0]);
        const startTop = drag.startGridY * (rowHeight + margin[1]);
        const nextLeft = startLeft + deltaX;
        const nextTop = startTop + deltaY;

        const movingWidget = widgetsRef.current.find((item) => item.id === drag.widgetId);
        if (!movingWidget) return;

        const nextX = Math.max(
          0,
          Math.min(
            Math.round(nextLeft / (cellWidth + margin[0])),
            currentCols - movingWidget.size.w
          )
        );
        const nextY = Math.max(0, Math.round(nextTop / (rowHeight + margin[1])));
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
        lastMoveResultRef.current = {
          preferredPosition: { x: nextX, y: nextY },
          result: previewLayout,
        };

        const movingPreview =
          previewLayout.widgets.find((item) => item.id === drag.widgetId)?.position ?? {
            x: nextX,
            y: nextY,
          };
        setDragPreviewPosition((current) =>
          arePositionsEqual(current, movingPreview) ? current : movingPreview
        );
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
          .filter((item): item is PositionUpdate => !!item);

        if (!arePositionUpdatesEqual(editPreviewUpdatesRef.current, previewUpdates)) {
          editPreviewUpdatesRef.current = previewUpdates;
          setEditPreviewUpdates(previewUpdates);
        }
      };

      const onPointerMove = (moveEvent: PointerEvent) => {
        pendingPointerRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
        if (pointerFrameRef.current !== null) return;
        pointerFrameRef.current = window.requestAnimationFrame(flushPointerMove);
      };

      const tickAutoScroll = () => {
        autoScrollFrameRef.current = null;

        const pending = pendingPointerRef.current;
        const scrollContainer = activeScrollContainerRef.current;
        if (!pending || !scrollContainer || !dragStartRef.current) {
          return;
        }

        const viewportRect = getViewportRect(scrollContainer);
        let deltaY = 0;

        if (pending.y < viewportRect.top + AUTO_SCROLL_EDGE_THRESHOLD) {
          const distance = viewportRect.top + AUTO_SCROLL_EDGE_THRESHOLD - pending.y;
          deltaY = -Math.min(
            AUTO_SCROLL_MAX_SPEED,
            Math.max(4, (distance / AUTO_SCROLL_EDGE_THRESHOLD) * AUTO_SCROLL_MAX_SPEED)
          );
        } else if (pending.y > viewportRect.bottom - AUTO_SCROLL_EDGE_THRESHOLD) {
          const distance = pending.y - (viewportRect.bottom - AUTO_SCROLL_EDGE_THRESHOLD);
          deltaY = Math.min(
            AUTO_SCROLL_MAX_SPEED,
            Math.max(4, (distance / AUTO_SCROLL_EDGE_THRESHOLD) * AUTO_SCROLL_MAX_SPEED)
          );
        }

        if (deltaY !== 0) {
          scrollByDelta(scrollContainer, deltaY);
          if (pointerFrameRef.current === null) {
            pointerFrameRef.current = window.requestAnimationFrame(flushPointerMove);
          }
          autoScrollFrameRef.current = window.requestAnimationFrame(tickAutoScroll);
        }
      };

      const onPointerUp = () => {
        const drag = dragStartRef.current;
        if (!drag) return;

        const preview = dragPreviewRef.current ?? { x: drag.startGridX, y: drag.startGridY };
        const cachedMoveResult =
          lastMoveResultRef.current &&
          arePositionsEqual(lastMoveResultRef.current.preferredPosition, preview)
            ? lastMoveResultRef.current.result
            : null;
        const moveResult =
          cachedMoveResult ??
          buildMoveResult({
            widgets: widgetsRef.current,
            widgetId: drag.widgetId,
            cols: currentCols,
            preferredPosition: preview,
          });

        if (moveResult.movedWidgetIds.length > 0) {
          batchUpdatePositions(
            moveResult.widgets.map((item) => ({
              id: item.id,
              position: item.position,
            }))
          );
        }

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        resetDragState();
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      activeScrollContainerRef.current = scrollContainerRef?.current ?? window;
      dragStartRef.current = {
        widgetId: widget.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startGridX: widget.position.x,
        startGridY: widget.position.y,
        startScrollTop: getScrollTop(activeScrollContainerRef.current),
        pointerId: event.pointerId,
        handleElement: event.currentTarget,
      };
      setDraggingWidgetId(widget.id);
      setDragPreviewPosition(widget.position);
      const initialOffset = { x: 0, y: 0 };
      setDragPointerOffset(initialOffset);
      dragPointerOffsetRef.current = initialOffset;
      setEditPreviewUpdates([]);
      editPreviewUpdatesRef.current = [];
      dragPreviewRef.current = widget.position;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      autoScrollFrameRef.current = window.requestAnimationFrame(tickAutoScroll);
    },
    [isEditing, cellWidth, margin, rowHeight, currentCols, batchUpdatePositions, resetDragState, scrollContainerRef]
  );

  return {
    draggingWidgetId,
    dragPreviewPosition,
    dragPointerOffset,
    editPreviewUpdates,
    setEditPreviewUpdates,
    handleDragHandlePointerDown,
  };
}
