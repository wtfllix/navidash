import { Widget, WidgetConfigByType, WidgetType, WidgetOfType } from '@/types';
import {
  canPlaceWidget,
  findConflictingWidgetIds,
  isWidgetLayoutValid,
  resolveControlledCollision,
} from '@/lib/layoutEngine';

export interface WidgetDropDetail {
  widgetType: string;
  defaultSize: { w: number; h: number };
  gridPosition?: { x: number; y: number };
  dropClient?: { x: number; y: number } | null;
  droppedOnGrid: boolean;
}

export interface WidgetCreatedDetail {
  widgetId: string;
  shouldOpenSettings: boolean;
}

export interface PlacementRequest<T extends WidgetType = WidgetType> {
  widgets: Widget[];
  widgetType: T;
  widgetId: string;
  defaultSize: { w: number; h: number };
  cols: number;
  preferredPosition?: { x: number; y: number };
  config?: WidgetConfigByType<T>;
  maxScanRows?: number;
}

export interface PlacementResult<T extends WidgetType = WidgetType> {
  newWidget: WidgetOfType<T>;
  isValid: boolean;
  positionUpdates: Array<{ id: string; position: { x: number; y: number } }>;
  collisionMode: 'none' | 'push';
}

export interface MoveRequest {
  widgets: Widget[];
  widgetId: string;
  cols: number;
  preferredPosition: { x: number; y: number };
}

export interface MoveResult {
  widgets: Widget[];
  isValid: boolean;
  position: { x: number; y: number };
  movedWidgetIds: string[];
  collisionMode: 'none' | 'swap' | 'push';
}

function findFirstAvailablePosition(
  widgets: Widget[],
  size: { w: number; h: number },
  cols: number,
  maxScanRows: number
): { x: number; y: number } {
  for (let y = 0; y < maxScanRows; y++) {
    for (let x = 0; x <= cols - size.w; x++) {
      if (canPlaceWidget(widgets, x, y, size.w, size.h, cols)) {
        return { x, y };
      }
    }
  }

  const maxY = widgets.reduce((max, widget) => {
    const bottom = widget.position.y + widget.size.h;
    return Math.max(max, bottom);
  }, 0);

  return { x: 0, y: maxY };
}

export function buildPlacementResult<T extends WidgetType>(
  request: PlacementRequest<T>
): PlacementResult<T> {
  const {
    widgets,
    widgetType,
    widgetId,
    defaultSize,
    cols,
    preferredPosition,
    config = {},
    maxScanRows = 20,
  } = request;

  const basePosition = preferredPosition
    ? preferredPosition
    : findFirstAvailablePosition(widgets, defaultSize, cols, maxScanRows);

  const newWidget = {
    id: widgetId,
    type: widgetType,
    size: defaultSize,
    position: basePosition,
    config: (config ?? {}) as WidgetConfigByType<T>,
  } as WidgetOfType<T>;

  const isValid = canPlaceWidget(
    widgets,
    basePosition.x,
    basePosition.y,
    defaultSize.w,
    defaultSize.h,
    cols
  );

  if (isValid) {
    return {
      newWidget,
      isValid: true,
      positionUpdates: [],
      collisionMode: 'none',
    };
  }

  const collisionResult = resolveControlledCollision(widgets, newWidget, cols);

  return {
    newWidget,
    isValid: collisionResult.isValid,
    positionUpdates: collisionResult.widgets
      .filter((widget) => collisionResult.movedWidgetIds.includes(widget.id))
      .map((widget) => ({ id: widget.id, position: widget.position })),
    collisionMode: collisionResult.isValid ? 'push' : 'none',
  };
}

export function buildMoveResult(request: MoveRequest): MoveResult {
  const { widgets, widgetId, cols, preferredPosition } = request;
  const movingWidget = widgets.find((widget) => widget.id === widgetId);

  if (!movingWidget) {
    return {
      widgets,
      isValid: false,
      position: preferredPosition,
      movedWidgetIds: [],
      collisionMode: 'none',
    };
  }

  const otherWidgets = widgets.filter((widget) => widget.id !== widgetId);
  const targetWidget = { ...movingWidget, position: preferredPosition } as Widget;
  const canMoveDirectly = canPlaceWidget(
    otherWidgets,
    preferredPosition.x,
    preferredPosition.y,
    movingWidget.size.w,
    movingWidget.size.h,
    cols
  );

  if (canMoveDirectly) {
    const hasMoved =
      preferredPosition.x !== movingWidget.position.x ||
      preferredPosition.y !== movingWidget.position.y;

    return {
      widgets: widgets.map((widget) => (widget.id === widgetId ? targetWidget : widget)),
      isValid: true,
      position: preferredPosition,
      movedWidgetIds: hasMoved ? [movingWidget.id] : [],
      collisionMode: 'none',
    };
  }

  const conflictingIds = findConflictingWidgetIds(otherWidgets, {
    x: preferredPosition.x,
    y: preferredPosition.y,
    w: movingWidget.size.w,
    h: movingWidget.size.h,
  });
  const swapTarget =
    conflictingIds.length === 1
      ? otherWidgets.find((widget) => widget.id === conflictingIds[0])
      : undefined;

  if (
    swapTarget &&
    swapTarget.size.w === movingWidget.size.w &&
    swapTarget.size.h === movingWidget.size.h &&
    swapTarget.position.x === preferredPosition.x &&
    swapTarget.position.y === preferredPosition.y
  ) {
    const swappedWidgets = widgets.map((widget) => {
      if (widget.id === movingWidget.id) return targetWidget;
      if (widget.id === swapTarget.id) {
        return { ...widget, position: movingWidget.position } as Widget;
      }
      return widget;
    });

    if (isWidgetLayoutValid(swappedWidgets, cols)) {
      return {
        widgets: swappedWidgets,
        isValid: true,
        position: preferredPosition,
        movedWidgetIds: [movingWidget.id, swapTarget.id],
        collisionMode: 'swap',
      };
    }
  }

  const collisionResult = resolveControlledCollision(otherWidgets, targetWidget, cols);
  if (!collisionResult.isValid) {
    return {
      widgets,
      isValid: false,
      position: preferredPosition,
      movedWidgetIds: [],
      collisionMode: 'none',
    };
  }

  const movedMap = new Map(
    [...collisionResult.widgets, targetWidget].map((widget) => [widget.id, widget])
  );

  return {
    widgets: widgets.map((widget) => movedMap.get(widget.id) ?? widget),
    isValid: true,
    position: preferredPosition,
    movedWidgetIds: [movingWidget.id, ...collisionResult.movedWidgetIds],
    collisionMode: 'push',
  };
}
