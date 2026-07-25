import { Widget, WidgetConfigEntry, WidgetLayout, WidgetLayoutMode, WidgetLayoutsByMode } from '@/types';
import { canPlaceWidget } from '@/lib/layoutEngine';
import { mergeWidgets, splitWidgets } from '@/lib/schemas';

export const DEFAULT_LAYOUT_MODE: WidgetLayoutMode = 'desktop';

export const LAYOUT_MODE_COLUMNS: Record<WidgetLayoutMode, number> = {
  desktop: 8,
  mobile: 2,
};

function asLayoutWidgets(layouts: WidgetLayout[]): Widget[] {
  return layouts.map((layout) => ({ ...layout, config: {} })) as Widget[];
}

function findFirstAvailablePosition(
  layouts: WidgetLayout[],
  size: { w: number; h: number },
  cols: number
) {
  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x <= cols - size.w; x += 1) {
      if (canPlaceWidget(asLayoutWidgets(layouts), x, y, size.w, size.h, cols)) {
        return { x, y };
      }
    }
  }

  return {
    x: 0,
    y: layouts.reduce((max, layout) => Math.max(max, layout.position.y + layout.size.h), 0),
  };
}

/**
 * 仅用于读取旧的单数组布局。新版双端布局进入此模块后保持原坐标，不再在普通加载中重排。
 */
export function migrateLegacyLayoutsForMode(
  layouts: WidgetLayout[],
  cols: number
): WidgetLayout[] {
  const placed: WidgetLayout[] = [];

  for (const layout of layouts) {
    const size = {
      ...layout.size,
      w: Math.min(layout.size.w, cols),
    };
    const canKeepPosition = canPlaceWidget(
      asLayoutWidgets(placed),
      layout.position.x,
      layout.position.y,
      size.w,
      size.h,
      cols
    );

    placed.push({
      ...layout,
      size,
      position: canKeepPosition
        ? { ...layout.position }
        : findFirstAvailablePosition(placed, size, cols),
    } as WidgetLayout);
  }

  return placed;
}

function cloneLayouts(layouts: WidgetLayout[]): WidgetLayout[] {
  return layouts.map((layout) => ({
    ...layout,
    size: { ...layout.size },
    position: { ...layout.position },
  })) as WidgetLayout[];
}

export function createLayoutsByModeFromWidgets(widgets: Widget[]): WidgetLayoutsByMode {
  const { layouts } = splitWidgets(widgets);
  const desktop = migrateLegacyLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.desktop);

  return {
    desktop,
    mobile: migrateLegacyLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.mobile),
  };
}

export function ensureLayoutsByMode(
  layouts: Partial<WidgetLayoutsByMode> | WidgetLayout[],
  fallbackWidgets: Widget[] = []
): WidgetLayoutsByMode {
  if (Array.isArray(layouts)) {
    const desktop = migrateLegacyLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.desktop);
    return {
      desktop,
      mobile: migrateLegacyLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.mobile),
    };
  }

  const fallbackLayouts = splitWidgets(fallbackWidgets).layouts;
  const desktop = cloneLayouts(layouts.desktop ?? fallbackLayouts);
  const mobile = cloneLayouts(layouts.mobile ?? fallbackLayouts);

  return { desktop, mobile };
}

export function mergeWidgetsForLayoutMode(
  layoutMode: WidgetLayoutMode,
  layoutsByMode: WidgetLayoutsByMode,
  configs: WidgetConfigEntry[],
  fallback: Widget[] = []
) {
  return mergeWidgets(layoutsByMode[layoutMode], configs, fallback);
}
