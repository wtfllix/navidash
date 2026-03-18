import { Widget, WidgetConfig, WidgetType } from '@/types';
import { calculateLayoutWithNewWidget, canPlaceWidget } from '@/lib/layoutEngine';

export interface WidgetDropDetail {
  widgetType: string;
  defaultSize: { w: number; h: number };
  gridPosition?: { x: number; y: number };
  dropClient?: { x: number; y: number } | null;
}

export interface PlacementRequest {
  widgets: Widget[];
  widgetType: WidgetType;
  widgetId: string;
  defaultSize: { w: number; h: number };
  cols: number;
  preferredPosition?: { x: number; y: number };
  config?: WidgetConfig;
  maxScanRows?: number;
}

export interface PlacementResult {
  newWidget: Widget;
  positionUpdates: Array<{ id: string; position: { x: number; y: number } }>;
  movedWidgetIds: string[];
}

function clampPreferredPosition(
  preferred: { x: number; y: number },
  size: { w: number; h: number },
  cols: number
): { x: number; y: number } {
  const clampedX = Math.max(0, Math.min(preferred.x, cols - size.w));
  const clampedY = Math.max(0, preferred.y);
  return { x: clampedX, y: clampedY };
}

function findFirstAvailablePosition(
  widgets: Widget[],
  size: { w: number; h: number },
  cols: number,
  maxScanRows: number
): { x: number; y: number } {
  for (let y = 0; y < maxScanRows; y++) {
    for (let x = 0; x <= cols - size.w; x++) {
      if (canPlaceWidget(widgets, x, y, size.w, size.h)) {
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

export function buildPlacementResult(request: PlacementRequest): PlacementResult {
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
    ? clampPreferredPosition(preferredPosition, defaultSize, cols)
    : findFirstAvailablePosition(widgets, defaultSize, cols, maxScanRows);

  const newWidget: Widget = {
    id: widgetId,
    type: widgetType,
    size: defaultSize,
    position: basePosition,
    config,
  };

  const layoutResult = calculateLayoutWithNewWidget(widgets, newWidget, cols);

  const positionUpdates = layoutResult.widgets
    .filter((widget) => widget.id !== newWidget.id)
    .map((widget) => ({
      id: widget.id,
      position: widget.position,
    }))
    .filter((update) => {
      const original = widgets.find((widget) => widget.id === update.id);
      return (
        !!original &&
        (original.position.x !== update.position.x || original.position.y !== update.position.y)
      );
    });

  return {
    newWidget,
    positionUpdates,
    movedWidgetIds: layoutResult.movedWidgetIds,
  };
}
