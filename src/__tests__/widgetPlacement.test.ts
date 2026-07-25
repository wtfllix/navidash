import { buildMoveResult, buildPlacementResult } from '@/lib/widgetPlacement';
import { Widget } from '@/types';

const existingWidget: Widget = {
  id: 'existing',
  type: 'links',
  size: { w: 2, h: 1 },
  position: { x: 0, y: 0 },
  config: {},
};

describe('widgetPlacement', () => {
  it('finds the first free position without moving existing widgets', () => {
    const result = buildPlacementResult({
      widgets: [existingWidget],
      widgetType: 'today',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 8,
    });

    expect(result.isValid).toBe(true);
    expect(result.newWidget.position).toEqual({ x: 2, y: 0 });
  });

  it('pushes a colliding widget downward without changing its column', () => {
    const result = buildPlacementResult({
      widgets: [existingWidget],
      widgetType: 'memo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 8,
      preferredPosition: { x: 0, y: 0 },
    });

    expect(result.isValid).toBe(true);
    expect(result.newWidget.position).toEqual({ x: 0, y: 0 });
    expect(result.collisionMode).toBe('push');
    expect(result.positionUpdates).toEqual([
      { id: 'existing', position: { x: 0, y: 1 } },
    ]);
  });

  it('rejects an out-of-bounds preferred position instead of clamping it', () => {
    const result = buildPlacementResult({
      widgets: [],
      widgetType: 'memo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 8,
      preferredPosition: { x: 7, y: 0 },
    });

    expect(result.isValid).toBe(false);
    expect(result.newWidget.position).toEqual({ x: 7, y: 0 });
  });

  it('moves only the selected widget when the target is free', () => {
    const otherWidget: Widget = {
      id: 'other',
      type: 'today',
      size: { w: 2, h: 1 },
      position: { x: 2, y: 0 },
      config: {},
    };

    const result = buildMoveResult({
      widgets: [existingWidget, otherWidget],
      widgetId: 'existing',
      cols: 8,
      preferredPosition: { x: 4, y: 1 },
    });

    expect(result.isValid).toBe(true);
    expect(result.position).toEqual({ x: 4, y: 1 });
    expect(result.movedWidgetIds).toEqual(['existing']);
    expect(result.widgets).toEqual([
      { ...existingWidget, position: { x: 4, y: 1 } },
      otherWidget,
    ]);
  });

  it('swaps positions for one same-sized collision', () => {
    const movingWidget: Widget = {
      id: 'moving',
      type: 'memo',
      size: { w: 2, h: 1 },
      position: { x: 2, y: 0 },
      config: {},
    };
    const widgets = [existingWidget, movingWidget];

    const result = buildMoveResult({
      widgets,
      widgetId: 'moving',
      cols: 8,
      preferredPosition: { x: 0, y: 0 },
    });

    expect(result.isValid).toBe(true);
    expect(result.position).toEqual({ x: 0, y: 0 });
    expect(result.collisionMode).toBe('swap');
    expect(result.widgets).toEqual([
      { ...existingWidget, position: { x: 2, y: 0 } },
      { ...movingWidget, position: { x: 0, y: 0 } },
    ]);
    expect(result.movedWidgetIds).toEqual(['moving', 'existing']);
  });

  it('pushes a different-sized collision chain downward', () => {
    const widgets: Widget[] = [
      existingWidget,
      {
        id: 'below',
        type: 'today',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 1 },
        config: {},
      },
      {
        id: 'moving',
        type: 'memo',
        size: { w: 1, h: 1 },
        position: { x: 4, y: 0 },
        config: {},
      },
    ];

    const result = buildMoveResult({
      widgets,
      widgetId: 'moving',
      cols: 8,
      preferredPosition: { x: 0, y: 0 },
    });

    expect(result.isValid).toBe(true);
    expect(result.collisionMode).toBe('push');
    expect(result.widgets.map(({ id, position }) => ({ id, position }))).toEqual([
      { id: 'existing', position: { x: 0, y: 1 } },
      { id: 'below', position: { x: 0, y: 2 } },
      { id: 'moving', position: { x: 0, y: 0 } },
    ]);
  });

  it('rejects a collision chain that would affect more than four widgets', () => {
    const widgets = Array.from({ length: 5 }, (_, index) => ({
      id: `stack-${index}`,
      type: 'links' as const,
      size: { w: 2, h: 1 },
      position: { x: 0, y: index },
      config: {},
    }));

    const result = buildPlacementResult({
      widgets,
      widgetType: 'memo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 8,
      preferredPosition: { x: 0, y: 0 },
    });

    expect(result.isValid).toBe(false);
    expect(result.positionUpdates).toEqual([]);
  });

  it('rejects moves for unknown widgets', () => {
    const result = buildMoveResult({
      widgets: [existingWidget],
      widgetId: 'missing',
      cols: 8,
      preferredPosition: { x: 1, y: 1 },
    });

    expect(result.isValid).toBe(false);
    expect(result.widgets).toEqual([existingWidget]);
  });
});
