import {
  ensureLayoutsByMode,
  LAYOUT_MODE_COLUMNS,
  migrateLegacyLayoutsForMode,
} from '@/lib/widgetLayouts';
import { WidgetLayout, WidgetLayoutsByMode } from '@/types';

describe('widgetLayouts', () => {
  it('uses the fixed desktop and mobile column counts', () => {
    expect(LAYOUT_MODE_COLUMNS).toEqual({ desktop: 8, mobile: 2 });
  });

  it('preserves coordinates from the current dual-layout format', () => {
    const layouts: WidgetLayoutsByMode = {
      desktop: [
        {
          id: 'desktop-link',
          type: 'links',
          size: { w: 2, h: 1 },
          position: { x: 6, y: 4 },
        },
      ],
      mobile: [
        {
          id: 'mobile-link',
          type: 'links',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 7 },
        },
      ],
    };

    expect(ensureLayoutsByMode(layouts)).toEqual(layouts);
  });

  it('migrates a legacy single layout deterministically without overlap', () => {
    const legacy: WidgetLayout[] = [
      {
        id: 'first',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 7, y: 0 },
      },
      {
        id: 'second',
        type: 'memo',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
      },
    ];

    expect(migrateLegacyLayoutsForMode(legacy, 8)).toEqual([
      { ...legacy[0], position: { x: 0, y: 0 } },
      { ...legacy[1], position: { x: 2, y: 0 } },
    ]);
  });
});
