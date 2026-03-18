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
interface LayoutWidget extends Widget {
  tempX?: number; // 临时位置（计算过程中使用）
  tempY?: number;
}

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
  preferredDirection: 'down' | 'right' | 'left' | 'up' = 'down'
): { x: number; y: number } | null {
  const currentX = movingWidget.tempX ?? movingWidget.position.x;
  const currentY = movingWidget.tempY ?? movingWidget.position.y;
  const { w, h } = movingWidget.size;

  // 定义搜索方向优先级
  const directions: Array<{ dx: number; dy: number }> = [
    { dx: 0, dy: 1 },   // 下
    { dx: 1, dy: 0 },   // 右
    { dx: -1, dy: 0 },  // 左
    { dx: 0, dy: -1 },  // 上
  ];

  // 根据首选方向重新排序
  if (preferredDirection === 'right') {
    directions.splice(0, 0, directions.splice(1, 1)[0]);
  } else if (preferredDirection === 'left') {
    directions.splice(0, 0, directions.splice(2, 1)[0]);
  } else if (preferredDirection === 'up') {
    directions.splice(0, 0, directions.splice(3, 1)[0]);
  }

  // 最大搜索距离
  const maxSearchDistance = 50;

  for (const { dx, dy } of directions) {
    for (let distance = 1; distance <= maxSearchDistance; distance++) {
      const newX = currentX + dx * distance * w;
      const newY = currentY + dy * distance * h;

      // 检查边界
      if (!isValidPosition(newX, newY, w, h, cols)) {
        if (dx !== 0) break; // 水平方向到达边界，停止该方向搜索
        continue; // 垂直方向可以继续尝试
      }

      // 检查是否与其他组件冲突
      const conflicts = findConflicts(widgets, { x: newX, y: newY, w, h }, movingWidget.id);

      if (conflicts.length === 0) {
        return { x: newX, y: newY };
      }
    }
  }

  // 如果所有方向都找不到位置，尝试放到最底部
  const maxY = widgets.reduce((max, w) => {
    const bottom = (w.tempY ?? w.position.y) + w.size.h;
    return Math.max(max, bottom);
  }, 0);

  // 尝试在底部找到合适的位置
  for (let x = 0; x <= cols - w; x++) {
    const conflicts = findConflicts(widgets, { x, y: maxY, w, h }, movingWidget.id);
    if (conflicts.length === 0) {
      return { x, y: maxY };
    }
  }

  return null;
}

/**
 * 计算放置新组件后的完整布局
 * 包括需要移动的所有现有组件
 * 
 * @returns 更新后的所有组件列表，以及被移动的组件ID列表
 */
export function calculateLayoutWithNewWidget(
  existingWidgets: Widget[],
  newWidget: {
    id: string;
    type: string;
    size: { w: number; h: number };
    position: { x: number; y: number };
    config: Record<string, any>;
  },
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
      widgets: [...existingWidgets, newWidget as Widget],
      movedWidgetIds: [],
    };
  }

  // 有冲突，需要推动组件
  const movedWidgetIds: string[] = [];
  const widgetsToProcess = [...initialConflicts];
  const processedIds = new Set<string>();

  while (widgetsToProcess.length > 0) {
    const currentWidget = widgetsToProcess.shift()!;

    if (processedIds.has(currentWidget.id)) {
      continue;
    }

    // 为当前组件寻找新位置
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
  }));

  // 添加新组件
  finalWidgets.push(newWidget as Widget);

  return {
    widgets: finalWidgets,
    movedWidgetIds,
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
