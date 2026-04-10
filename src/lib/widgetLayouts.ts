import { Widget, WidgetConfigEntry, WidgetLayout, WidgetLayoutMode, WidgetLayoutsByMode } from '@/types';
import { canPlaceWidget } from '@/lib/layoutEngine';
import { mergeWidgets, splitWidgets } from '@/lib/schemas';

export const DEFAULT_LAYOUT_MODE: WidgetLayoutMode = 'desktop';

export const LAYOUT_MODE_COLUMNS: Record<WidgetLayoutMode, number> = {
  desktop: 8,
  mobile: 2,
};

function sortLayouts(layouts: WidgetLayout[]) {
  return [...layouts].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }

    if (a.position.x !== b.position.x) {
      return a.position.x - b.position.x;
    }

    return a.id.localeCompare(b.id);
  });
}

function findFirstAvailablePosition(
  layouts: WidgetLayout[],
  size: { w: number; h: number },
  cols: number
) {
  for (let y = 0; y < 200; y += 1) {
    for (let x = 0; x <= cols - size.w; x += 1) {
      const canPlace = canPlaceWidget(
        layouts.map((layout) => ({ ...layout, config: {} })) as Widget[],
        x,
        y,
        size.w,
        size.h
      );

      if (canPlace) {
        return { x, y };
      }
    }
  }

  const maxY = layouts.reduce((max, layout) => Math.max(max, layout.position.y + layout.size.h), 0);
  return { x: 0, y: maxY };
}

function clampLayoutToCols(layout: WidgetLayout, cols: number): WidgetLayout {
  const size = {
    ...layout.size,
    w: Math.min(layout.size.w, cols),
  };
  const position = {
    x: Math.max(0, Math.min(layout.position.x, Math.max(0, cols - size.w))),
    y: Math.max(0, layout.position.y),
  };

  return {
    ...layout,
    size,
    position,
  };
}

export function normalizeLayoutsForMode(layouts: WidgetLayout[], cols: number): WidgetLayout[] {
  const placed: WidgetLayout[] = [];

  for (const layout of sortLayouts(layouts)) {
    const candidate = clampLayoutToCols(layout, cols);
    const canPlace = canPlaceWidget(
      placed.map((item) => ({ ...item, config: {} })) as Widget[],
      candidate.position.x,
      candidate.position.y,
      candidate.size.w,
      candidate.size.h
    );

    if (canPlace) {
      placed.push(candidate);
      continue;
    }

    placed.push({
      ...candidate,
      position: findFirstAvailablePosition(placed, candidate.size, cols),
    });
  }

  return placed;
}

export function createLayoutsByModeFromWidgets(widgets: Widget[]): WidgetLayoutsByMode {
  const { layouts } = splitWidgets(widgets);

  return {
    desktop: normalizeLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.desktop),
    mobile: normalizeLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.mobile),
  };
}

export function ensureLayoutsByMode(
  layouts: Partial<WidgetLayoutsByMode> | WidgetLayout[],
  fallbackWidgets: Widget[] = []
): WidgetLayoutsByMode {
  if (Array.isArray(layouts)) {
    const desktopLayouts = normalizeLayoutsForMode(layouts, LAYOUT_MODE_COLUMNS.desktop);

    return {
      desktop: desktopLayouts,
      mobile: normalizeLayoutsForMode(desktopLayouts, LAYOUT_MODE_COLUMNS.mobile),
    };
  }

  const fallbackLayouts = splitWidgets(fallbackWidgets).layouts;
  const desktopSource = layouts.desktop ?? fallbackLayouts;
  const mobileSource = layouts.mobile ?? desktopSource;

  return {
    desktop: normalizeLayoutsForMode(desktopSource, LAYOUT_MODE_COLUMNS.desktop),
    mobile: normalizeLayoutsForMode(mobileSource, LAYOUT_MODE_COLUMNS.mobile),
  };
}

export function mergeWidgetsForLayoutMode(
  layoutMode: WidgetLayoutMode,
  layoutsByMode: WidgetLayoutsByMode,
  configs: WidgetConfigEntry[],
  fallback: Widget[] = []
) {
  return mergeWidgets(layoutsByMode[layoutMode], configs, fallback);
}
