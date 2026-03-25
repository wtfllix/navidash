import { buildPlacementResult } from '@/lib/widgetPlacement';
import { Widget } from '@/types';

describe('widgetPlacement', () => {
  it('places widget at first available slot when no preferred position', () => {
    const widgets: Widget[] = [
      {
        id: 'w1',
        type: 'clock',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
    ];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'weather',
      widgetId: 'new',
      defaultSize: { w: 1, h: 1 },
      cols: 4,
    });

    expect(result.newWidget.position).toEqual({ x: 2, y: 0 });
    expect(result.positionUpdates).toEqual([]);
    expect(result.movedWidgetIds).toEqual([]);
  });

  it('pushes conflicting widgets when preferred position conflicts', () => {
    const widgets: Widget[] = [
      {
        id: 'w1',
        type: 'clock',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
    ];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'todo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 4,
      preferredPosition: { x: 0, y: 0 },
    });

    expect(result.newWidget.position).toEqual({ x: 0, y: 0 });
    expect(result.movedWidgetIds).toContain('w1');
    expect(result.positionUpdates).toEqual([{ id: 'w1', position: { x: 0, y: 1 } }]);
  });

  it('reflows conflicting chain by auto-moving widgets downward', () => {
    const widgets: Widget[] = [
      {
        id: 'w1',
        type: 'clock',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: 'w2',
        type: 'weather',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 1 },
        config: {},
      },
    ];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'todo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 4,
      preferredPosition: { x: 0, y: 0 },
    });

    expect(result.newWidget.position).toEqual({ x: 0, y: 0 });
    expect(result.movedWidgetIds).toContain('w1');
    expect(result.positionUpdates).toEqual([
      { id: 'w1', position: { x: 0, y: 1 } },
      { id: 'w2', position: { x: 0, y: 2 } },
    ]);
  });

  it('keeps pushed widgets in same column instead of moving right', () => {
    const widgets: Widget[] = [
      {
        id: 'w1',
        type: 'clock',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: 'w2',
        type: 'weather',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 1 },
        config: {},
      },
    ];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'todo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 4,
      preferredPosition: { x: 0, y: 0 },
    });

    const movedW1 = result.positionUpdates.find((item) => item.id === 'w1');
    expect(movedW1).toBeDefined();
    expect(movedW1!.position.x).toBe(0);
    expect(movedW1!.position.y).toBe(1);
  });

  it('does not send nearest lower widget to tail when lower widgets have different heights', () => {
    const widgets: Widget[] = [
      {
        id: 'near',
        type: 'clock',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 1 },
        config: {},
      },
      {
        id: 'below-large',
        type: 'weather',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 2 },
        config: {},
      },
    ];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'todo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 4,
      preferredPosition: { x: 0, y: 1 },
    });

    const nearUpdate = result.positionUpdates.find((item) => item.id === 'near');
    const belowUpdate = result.positionUpdates.find((item) => item.id === 'below-large');

    expect(nearUpdate).toBeDefined();
    expect(belowUpdate).toBeDefined();
    // 预期先把下方大组件下推，再让紧邻组件就近下移到 y=2
    expect(belowUpdate!.position.y).toBe(3);
    expect(nearUpdate!.position.y).toBe(2);
  });

  it('moves lower widget enough when placing a tall widget to avoid bottom-half overlap', () => {
    const widgets: Widget[] = [
      {
        id: 'below',
        type: 'clock',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 2 },
        config: {},
      },
    ];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'todo',
      widgetId: 'new-tall',
      defaultSize: { w: 2, h: 2 },
      cols: 4,
      preferredPosition: { x: 0, y: 1 },
    });

    expect(result.newWidget.position).toEqual({ x: 0, y: 1 });
    expect(result.positionUpdates).toEqual([{ id: 'below', position: { x: 0, y: 3 } }]);
  });

  it('clamps preferred x to grid bounds', () => {
    const widgets: Widget[] = [];

    const result = buildPlacementResult({
      widgets,
      widgetType: 'memo',
      widgetId: 'new',
      defaultSize: { w: 2, h: 1 },
      cols: 4,
      preferredPosition: { x: 99, y: 0 },
    });

    expect(result.newWidget.position).toEqual({ x: 2, y: 0 });
  });
});
