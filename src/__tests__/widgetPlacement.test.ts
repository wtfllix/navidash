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
