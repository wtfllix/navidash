import { Widget } from '@/types';

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function checkOverlap(a: GridRect, b: GridRect): boolean {
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

export function isWithinGrid(rect: GridRect, cols: number): boolean {
  return (
    Number.isInteger(rect.x) &&
    Number.isInteger(rect.y) &&
    Number.isInteger(rect.w) &&
    Number.isInteger(rect.h) &&
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.w > 0 &&
    rect.h > 0 &&
    rect.x + rect.w <= cols
  );
}

export function findConflictingWidgetIds(
  widgets: Widget[],
  target: GridRect,
  excludeId?: string
): string[] {
  return widgets
    .filter((widget) => {
      if (widget.id === excludeId) return false;
      return checkOverlap(
        {
          x: widget.position.x,
          y: widget.position.y,
          w: widget.size.w,
          h: widget.size.h,
        },
        target
      );
    })
    .map((widget) => widget.id);
}

export function canPlaceWidget(
  widgets: Widget[],
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  excludeId?: string
): boolean {
  const target = { x, y, w, h };
  return (
    isWithinGrid(target, cols) &&
    findConflictingWidgetIds(widgets, target, excludeId).length === 0
  );
}

export interface ControlledCollisionResult {
  isValid: boolean;
  widgets: Widget[];
  movedWidgetIds: string[];
}

export function isWidgetLayoutValid(widgets: Widget[], cols: number): boolean {
  return widgets.every((widget) =>
    canPlaceWidget(
      widgets,
      widget.position.x,
      widget.position.y,
      widget.size.w,
      widget.size.h,
      cols,
      widget.id
    )
  );
}

/**
 * 将 target 固定在目标位置，只让与它相交的现有组件保持 x 坐标向下移动。
 * movedWidgetIds 的数量限制让一次操作不会演变成全局重排。
 */
export function resolveControlledCollision(
  widgets: Widget[],
  target: Widget,
  cols: number,
  maxAffectedWidgets = 4
): ControlledCollisionResult {
  if (
    !isWithinGrid(
      {
        x: target.position.x,
        y: target.position.y,
        w: target.size.w,
        h: target.size.h,
      },
      cols
    )
  ) {
    return { isValid: false, widgets, movedWidgetIds: [] };
  }

  const working = widgets.map((widget) => ({
    ...widget,
    size: { ...widget.size },
    position: { ...widget.position },
    config: { ...widget.config },
  })) as Widget[];
  const queue: Widget[] = [target];
  const movedWidgetIds = new Set<string>();
  let iterations = 0;

  while (queue.length > 0) {
    const pusher = queue.shift()!;
    const conflicts = working
      .filter(
        (widget) =>
          widget.id !== pusher.id &&
          checkOverlap(
            {
              x: pusher.position.x,
              y: pusher.position.y,
              w: pusher.size.w,
              h: pusher.size.h,
            },
            {
              x: widget.position.x,
              y: widget.position.y,
              w: widget.size.w,
              h: widget.size.h,
            }
          )
      )
      .sort((a, b) => {
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        if (a.position.x !== b.position.x) return a.position.x - b.position.x;
        return a.id.localeCompare(b.id);
      });

    for (const conflict of conflicts) {
      if (!movedWidgetIds.has(conflict.id) && movedWidgetIds.size >= maxAffectedWidgets) {
        return { isValid: false, widgets, movedWidgetIds: [] };
      }

      conflict.position = {
        x: conflict.position.x,
        y: pusher.position.y + pusher.size.h,
      };
      movedWidgetIds.add(conflict.id);
      queue.push(conflict);
    }

    iterations += 1;
    if (iterations > widgets.length * (maxAffectedWidgets + 1) + 1) {
      return { isValid: false, widgets, movedWidgetIds: [] };
    }
  }

  const finalWidgets = [...working, target];
  if (!isWidgetLayoutValid(finalWidgets, cols)) {
    return { isValid: false, widgets, movedWidgetIds: [] };
  }

  return {
    isValid: true,
    widgets: working,
    movedWidgetIds: Array.from(movedWidgetIds),
  };
}

export function getWidgetCells(widget: Widget): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];

  for (let dy = 0; dy < widget.size.h; dy += 1) {
    for (let dx = 0; dx < widget.size.w; dx += 1) {
      cells.push({
        x: widget.position.x + dx,
        y: widget.position.y + dy,
      });
    }
  }

  return cells;
}
