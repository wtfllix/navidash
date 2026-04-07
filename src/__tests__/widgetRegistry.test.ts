jest.mock('../components/widgets/ClockWidget', () => () => null);
jest.mock('../components/widgets/LinksWidget', () => () => null);
jest.mock('../components/widgets/WeatherWidget', () => () => null);
jest.mock('../components/widgets/DateWidget', () => () => null);
jest.mock('../components/widgets/QuickLinkWidget', () => () => null);
jest.mock('../components/widgets/TodoWidget', () => () => null);
jest.mock('../components/widgets/MemoWidget', () => () => null);
jest.mock('../components/widgets/CalendarWidget', () => () => null);
jest.mock('../components/widgets/PhotoWidget', () => () => null);

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
    const rendererTypes = Object.keys(widgetComponentRegistry);

    for (const type of Array.from(pickerTypes) as WidgetType[]) {
      expect(widgetComponentRegistry[type]).toBeDefined();
    }

    for (const type of rendererTypes) {
      expect(pickerTypes.has(type as Widget['type'])).toBe(true);
    }
  });
});
