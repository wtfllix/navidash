jest.mock('../components/widgets/LinksWidget', () => () => null);
jest.mock('../components/widgets/MemoWidget', () => () => null);
jest.mock('../components/widgets/PhotoWidget', () => () => null);
jest.mock('../components/widgets/TodayWidget', () => () => null);
jest.mock('../components/widgets/F1Widget', () => () => null);
jest.mock('../components/widgets/KomariWidget', () => () => null);

import { widgetComponentRegistry, widgetMeta } from '@/components/widgets/registry';
import { WidgetSchema } from '@/lib/schemas';
import { Widget, WidgetType } from '@/types';

describe('widget registry integration', () => {
  it('keeps widget picker types unique', () => {
    const types = widgetMeta.map((meta) => meta.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('keeps widget picker entries schema-compatible with their default sizes', () => {
    const widgets: Widget[] = widgetMeta.map((meta, index) => ({
      id: `meta-${meta.type}`,
      type: meta.type,
      size: meta.defaultSize,
      position: { x: index % 4, y: Math.floor(index / 4) },
      config: {},
    })) as Widget[];

    for (const widget of widgets) {
      expect(WidgetSchema.safeParse(widget).success).toBe(true);
    }
  });

  it('keeps widget picker metadata aligned with registered renderers', () => {
    const pickerTypes = new Set(widgetMeta.map((meta) => meta.type));

    for (const type of Array.from(pickerTypes) as WidgetType[]) {
      expect(widgetComponentRegistry[type]).toBeDefined();
    }
  });

  it('keeps the picker and renderer registry limited to current widget types', () => {
    const pickerTypes = new Set(widgetMeta.map((meta) => meta.type));
    const registeredTypes = Object.keys(widgetComponentRegistry);

    expect([...pickerTypes].sort()).toEqual(
      ['f1', 'komari', 'links', 'memo', 'photo-frame', 'today'].sort()
    );
    expect(registeredTypes.sort()).toEqual([...pickerTypes].sort());
  });
});
