/**
 * Layout Engine
 * 智能布局算法，处理组件拖拽放置时的自动避让和推动逻辑
 * 
 * 核心功能：
 * 1. 碰撞检测 - 检查组件之间是否重叠
 * 2. 推动链计算 - 计算需要移动的所有组件
 * 3. 位置寻找 - 为被推动的组件寻找最佳新位置
 */

import { Widget } from '@/types';

/**
 * 布局中的组件（包含计算所需的额外信息）
 */
type LayoutWidget = Widget & {
  tempX?: number; // 临时位置（计算过程中使用）
  tempY?: number;
};

/**
 * 矩形区域
 */
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 检查两个矩形是否重叠
 */
export function checkOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.w <= b.x || // a 在 b 左边
    a.x >= b.x + b.w || // a 在 b 右边
    a.y + a.h <= b.y || // a 在 b 上边
    a.y >= b.y + b.h    // a 在 b 下边
  );
}

/**
 * 检查目标位置是否与现有组件冲突
 * @returns 冲突的组件列表
 */
export function findConflicts(
  widgets: LayoutWidget[],
  target: Rect,
  excludeId?: string
): LayoutWidget[] {
  return widgets.filter(w => {
    if (w.id === excludeId) return false;
    const widgetRect = {
      x: w.tempX ?? w.position.x,
      y: w.tempY ?? w.position.y,
      w: w.size.w,
      h: w.size.h,
    };
    return checkOverlap(widgetRect, target);
  });
}

/**
 * 检查位置是否有效（在网格范围内）
 */
export function isValidPosition(
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  maxRows: number = 100
): boolean {
  return x >= 0 && y >= 0 && x + w <= cols && y + h <= maxRows;
}

/**
 * 为被推动的组件寻找新位置
 * 策略：优先向下，然后向右，然后向左，最后向上
 */
export function findNewPosition(
  widgets: LayoutWidget[],
  movingWidget: LayoutWidget,
  cols: number,
  _preferredDirection: 'down' | 'right' | 'left' | 'up' = 'down'
): { x: number; y: number } | null {
  const currentX = movingWidget.tempX ?? movingWidget.position.x;
  const currentY = movingWidget.tempY ?? movingWidget.position.y;
  const { w, h } = movingWidget.size;
  const maxBottom = widgets.reduce((max, widget) => {
    const bottom = (widget.tempY ?? widget.position.y) + widget.size.h;
    return Math.max(max, bottom);
  }, 0);
  const searchLimit = maxBottom + 200;

  // 严格纵向挤压：仅在当前列向下寻找位置，避免横向“飞走”
  for (let y = currentY + 1; y <= searchLimit; y++) {
    if (!isValidPosition(currentX, y, w, h, cols, searchLimit + h + 1)) {
      continue;
    }
    const conflicts = findConflicts(widgets, { x: currentX, y, w, h }, movingWidget.id);
    if (conflicts.length === 0) {
      return { x: currentX, y };
    }
  }

  // 理论上不会命中，保底仍保持同列下移
  return { x: currentX, y: maxBottom + 1 };
}

/**
 * 计算放置新组件后的完整布局
 * 包括需要移动的所有现有组件
 * 
 * @returns 更新后的所有组件列表，以及被移动的组件ID列表
 */
export function calculateLayoutWithNewWidget(
  existingWidgets: Widget[],
  newWidget: Widget,
  cols: number
): {
  widgets: Widget[];
  movedWidgetIds: string[];
} {
  // 深拷贝现有组件，避免修改原始数据
  const workingWidgets: LayoutWidget[] = existingWidgets.map(w => ({
    ...w,
    tempX: w.position.x,
    tempY: w.position.y,
  }));

  // 检查新组件位置是否冲突
  const newWidgetRect = {
    x: newWidget.position.x,
    y: newWidget.position.y,
    w: newWidget.size.w,
    h: newWidget.size.h,
  };

  const initialConflicts = findConflicts(workingWidgets, newWidgetRect);

  // 如果没有冲突，直接返回
  if (initialConflicts.length === 0) {
    return {
      widgets: [...existingWidgets, newWidget],
      movedWidgetIds: [],
    };
  }

  // 有冲突，需要推动组件
  const movedWidgetIds: string[] = [];
  const widgetsToProcess = [...initialConflicts].sort((a, b) => {
    const ay = a.tempY ?? a.position.y;
    const by = b.tempY ?? b.position.y;
    if (by !== ay) return by - ay;
    return (b.tempX ?? b.position.x) - (a.tempX ?? a.position.x);
  });
  const processedIds = new Set<string>();
  const retryCounts = new Map<string, number>();

  while (widgetsToProcess.length > 0) {
    const currentWidget = widgetsToProcess.shift()!;

    if (processedIds.has(currentWidget.id)) {
      continue;
    }

    const currentX = currentWidget.tempX ?? currentWidget.position.x;
    const currentY = currentWidget.tempY ?? currentWidget.position.y;
    const oneStepDown = { x: currentX, y: currentY + 1 };

    // 先尝试“仅下移一格”。若被阻挡，优先推动阻挡者，形成自然的链式下压。
    if (isValidPosition(oneStepDown.x, oneStepDown.y, currentWidget.size.w, currentWidget.size.h, cols)) {
      const blockers = findConflicts(
        [...workingWidgets, newWidget as LayoutWidget],
        {
          x: oneStepDown.x,
          y: oneStepDown.y,
          w: currentWidget.size.w,
          h: currentWidget.size.h,
        },
        currentWidget.id
      );

      if (blockers.length === 0) {
        currentWidget.tempX = oneStepDown.x;
        currentWidget.tempY = oneStepDown.y;
        movedWidgetIds.push(currentWidget.id);
        processedIds.add(currentWidget.id);
        continue;
      }

      const retryCount = (retryCounts.get(currentWidget.id) ?? 0) + 1;
      retryCounts.set(currentWidget.id, retryCount);
      const maxRetries = workingWidgets.length + 2;

      if (retryCount <= maxRetries) {
        for (const blocker of blockers) {
          if (!processedIds.has(blocker.id) && !widgetsToProcess.includes(blocker)) {
            widgetsToProcess.push(blocker);
          }
        }
        if (!widgetsToProcess.includes(currentWidget)) {
          widgetsToProcess.push(currentWidget);
        }
        widgetsToProcess.sort((a, b) => {
          const ay = a.tempY ?? a.position.y;
          const by = b.tempY ?? b.position.y;
          if (by !== ay) return by - ay;
          return (b.tempX ?? b.position.x) - (a.tempX ?? a.position.x);
        });
        continue;
      }
    }

    // 回退：在同列向下寻找可用位置
    const newPosition = findNewPosition(
      [...workingWidgets, newWidget as LayoutWidget],
      currentWidget,
      cols,
      'down'
    );

    if (newPosition) {
      // 更新临时位置
      currentWidget.tempX = newPosition.x;
      currentWidget.tempY = newPosition.y;
      movedWidgetIds.push(currentWidget.id);

      // 检查新位置是否又产生新的冲突
      const newConflicts = findConflicts(
        workingWidgets,
        {
          x: newPosition.x,
          y: newPosition.y,
          w: currentWidget.size.w,
          h: currentWidget.size.h,
        },
        currentWidget.id
      );

      // 将新冲突加入处理队列
      for (const conflict of newConflicts) {
        if (!processedIds.has(conflict.id) && !widgetsToProcess.includes(conflict)) {
          widgetsToProcess.push(conflict);
        }
      }
      // 冲突链按“先下后上”处理，避免上方组件被直接推到末尾
      widgetsToProcess.sort((a, b) => {
        const ay = a.tempY ?? a.position.y;
        const by = b.tempY ?? b.position.y;
        if (by !== ay) return by - ay;
        return (b.tempX ?? b.position.x) - (a.tempX ?? a.position.x);
      });
    }

    processedIds.add(currentWidget.id);
  }

  // 构建最终结果
  const finalWidgets: Widget[] = workingWidgets.map(w => ({
    ...w,
    position: {
      x: w.tempX!,
      y: w.tempY!,
    },
  }) as Widget);

  // 添加新组件
  finalWidgets.push(newWidget);

  return {
    widgets: finalWidgets,
    movedWidgetIds: Array.from(new Set(movedWidgetIds)),
  };
}

/**
 * 简化版：仅检查是否可以放置，不计算推动
 */
export function canPlaceWidget(
  widgets: Widget[],
  x: number,
  y: number,
  w: number,
  h: number,
  excludeId?: string
): boolean {
  const conflicts = findConflicts(
    widgets.map(w => ({ ...w, tempX: w.position.x, tempY: w.position.y })),
    { x, y, w, h },
    excludeId
  );
  return conflicts.length === 0;
}

/**
 * 获取组件的网格占用区域
 */
export function getWidgetCells(widget: Widget): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  const { x, y } = widget.position;
  const { w, h } = widget.size;

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      cells.push({ x: x + dx, y: y + dy });
    }
  }

  return cells;
}
