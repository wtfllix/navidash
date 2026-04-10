import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Widget, WidgetConfigEntry, WidgetLayoutMode, WidgetLayoutsByMode } from '@/types';
import {
  normalizeWidgets,
  splitWidgets,
  WidgetConfigsArraySchema,
  WidgetSchema,
  WidgetStorePersistedStateSchema,
} from '@/lib/schemas';
import {
  DEFAULT_LAYOUT_MODE,
  ensureLayoutsByMode,
  LAYOUT_MODE_COLUMNS,
  mergeWidgetsForLayoutMode,
  normalizeLayoutsForMode,
} from '@/lib/widgetLayouts';

type WidgetUpdate = Partial<Pick<Widget, 'size' | 'position' | 'config'>>;

interface WidgetState {
  widgets: Widget[];
  widgetConfigs: WidgetConfigEntry[];
  layoutsByMode: WidgetLayoutsByMode;
  activeLayoutMode: WidgetLayoutMode;
  mobileLayoutUndoStack: WidgetLayoutsByMode['mobile'][];
  mobileLayoutSessionBaseline: WidgetLayoutsByMode['mobile'] | null;
  isMobileLayoutSessionActive: boolean;
  canUndoMobileLayout: boolean;
  canRestoreMobileLayout: boolean;
  setActiveLayoutMode: (mode: WidgetLayoutMode) => void;
  beginMobileLayoutSession: () => void;
  endMobileLayoutSession: () => void;
  undoMobileLayoutChange: () => void;
  restoreMobileLayoutBaseline: () => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, data: WidgetUpdate) => void;
  setWidgets: (widgets: Widget[]) => void;
  saveWidgetConfigs: () => Promise<boolean>;
  fetchWidgets: () => Promise<void>;
  dataVersion?: number;
  batchUpdatePositions: (updates: Array<{ id: string; position: { x: number; y: number } }>) => void;
  addWidgetWithLayout: (
    newWidget: Widget,
    positionUpdates: Array<{ id: string; position: { x: number; y: number } }>
  ) => void;
}

const initialWidgets: Widget[] = [
  {
    id: '1',
    type: 'clock',
    size: { w: 2, h: 1 },
    position: { x: 0, y: 0 },
    config: {},
  },
  {
    id: '2',
    type: 'weather',
    size: { w: 2, h: 1 },
    position: { x: 2, y: 0 },
    config: {},
  },
];

const persistKey = 'widget-storage';

function validateWidgets(widgets: unknown, fallback: Widget[] = initialWidgets): Widget[] {
  return normalizeWidgets(widgets, fallback);
}

function parseServerVersion(value: unknown): number | undefined {
  const version = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(version) && version >= 0 ? version : undefined;
}

function mergeWidgetUpdate(widget: Widget, data: WidgetUpdate): Widget {
  const candidate = {
    ...widget,
    ...data,
    config: data.config ?? widget.config,
  };
  const result = WidgetSchema.safeParse(candidate);

  if (result.success) {
    return result.data;
  }

  console.error('Rejected invalid widget update:', result.error.flatten());
  return widget;
}

function updateWidgetConfigEntry(
  widgetConfigs: WidgetConfigEntry[],
  widget: Widget | undefined,
  nextConfig: WidgetUpdate['config']
): WidgetConfigEntry[] {
  if (!widget || !nextConfig) {
    return widgetConfigs;
  }

  const mergedWidget = mergeWidgetUpdate(widget, { config: nextConfig });
  const nextEntry = {
    id: mergedWidget.id,
    type: mergedWidget.type,
    config: mergedWidget.config,
  } as WidgetConfigEntry;

  return widgetConfigs.map((entry) => (entry.id === mergedWidget.id ? nextEntry : entry));
}

function layoutContainsWidget(layoutsByMode: WidgetLayoutsByMode, id: string) {
  return Object.values(layoutsByMode).some((layouts) => layouts.some((widget) => widget.id === id));
}

function cloneLayouts(layouts: WidgetLayoutsByMode['mobile']) {
  return layouts.map((layout) => ({
    ...layout,
    size: { ...layout.size },
    position: { ...layout.position },
  }));
}

function areLayoutsEqual(a: WidgetLayoutsByMode['mobile'], b: WidgetLayoutsByMode['mobile']) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((layout, index) => {
    const other = b[index];

    return (
      layout.id === other?.id &&
      layout.type === other.type &&
      layout.size.w === other.size.w &&
      layout.size.h === other.size.h &&
      layout.position.x === other.position.x &&
      layout.position.y === other.position.y
    );
  });
}

function getMobileLayoutSessionState(
  nextMobileLayouts: WidgetLayoutsByMode['mobile'],
  currentState: Pick<
    WidgetState,
    'mobileLayoutUndoStack' | 'mobileLayoutSessionBaseline' | 'isMobileLayoutSessionActive'
  >,
  previousMobileLayouts?: WidgetLayoutsByMode['mobile']
) {
  const baseline = currentState.mobileLayoutSessionBaseline;
  const canRestoreMobileLayout = !!baseline && !areLayoutsEqual(nextMobileLayouts, baseline);

  if (
    !currentState.isMobileLayoutSessionActive ||
    !previousMobileLayouts ||
    areLayoutsEqual(previousMobileLayouts, nextMobileLayouts)
  ) {
    return {
      mobileLayoutUndoStack: currentState.mobileLayoutUndoStack,
      mobileLayoutSessionBaseline: baseline,
      canUndoMobileLayout: currentState.mobileLayoutUndoStack.length > 0,
      canRestoreMobileLayout,
    };
  }

  return {
    mobileLayoutUndoStack: [...currentState.mobileLayoutUndoStack, cloneLayouts(previousMobileLayouts)],
    mobileLayoutSessionBaseline: baseline,
    canUndoMobileLayout: true,
    canRestoreMobileLayout,
  };
}

function getInitialLayoutsByMode() {
  return ensureLayoutsByMode(initialWidgets, initialWidgets);
}

function getInitialWidgetConfigs(): WidgetConfigEntry[] {
  return splitWidgets(initialWidgets).configs;
}

function hydrateWidgets(
  layoutMode: WidgetLayoutMode,
  layoutsByMode: WidgetLayoutsByMode,
  widgetConfigs: WidgetConfigEntry[],
  fallback: Widget[] = initialWidgets
) {
  return mergeWidgetsForLayoutMode(layoutMode, layoutsByMode, widgetConfigs, fallback);
}

let saveTimeout: NodeJS.Timeout | null = null;

const saveLayoutsToServer = (layoutsByMode: WidgetLayoutsByMode) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      const res = await fetch('/api/widget-layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layoutsByMode),
      });

      if (!res.ok) {
        throw new Error(`Failed to save widget layouts: ${res.status}`);
      }

      const data = await res.json();
      const version = parseServerVersion(data?.version);

      if (version !== undefined) {
        useWidgetStore.setState({ dataVersion: version });
      }
    } catch (error) {
      console.error('Failed to save widget layouts:', error);
    } finally {
      saveTimeout = null;
    }
  }, 1000);
};

const saveConfigsToServer = async (configs: WidgetConfigEntry[]) => {
  const res = await fetch('/api/widget-configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configs),
  });

  if (!res.ok) {
    throw new Error(`Failed to save widget configs: ${res.status}`);
  }

  const data = await res.json();
  const version = parseServerVersion(data?.version);

  if (version !== undefined) {
    useWidgetStore.setState({ dataVersion: version });
  }
};

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: initialWidgets,
      widgetConfigs: getInitialWidgetConfigs(),
      layoutsByMode: getInitialLayoutsByMode(),
      activeLayoutMode: DEFAULT_LAYOUT_MODE,
      mobileLayoutUndoStack: [],
      mobileLayoutSessionBaseline: null,
      isMobileLayoutSessionActive: false,
      canUndoMobileLayout: false,
      canRestoreMobileLayout: false,
      setActiveLayoutMode: (activeLayoutMode) =>
        set((state) => ({
          activeLayoutMode,
          widgets: hydrateWidgets(activeLayoutMode, state.layoutsByMode, state.widgetConfigs),
        })),
      beginMobileLayoutSession: () =>
        set((state) => {
          if (state.isMobileLayoutSessionActive) {
            return state;
          }

          const baseline = cloneLayouts(state.layoutsByMode.mobile);

          return {
            isMobileLayoutSessionActive: true,
            mobileLayoutSessionBaseline: baseline,
            mobileLayoutUndoStack: [],
            canUndoMobileLayout: false,
            canRestoreMobileLayout: false,
          };
        }),
      endMobileLayoutSession: () =>
        set({
          isMobileLayoutSessionActive: false,
          mobileLayoutSessionBaseline: null,
          mobileLayoutUndoStack: [],
          canUndoMobileLayout: false,
          canRestoreMobileLayout: false,
        }),
      undoMobileLayoutChange: () =>
        set((state) => {
          if (state.mobileLayoutUndoStack.length === 0) {
            return state;
          }

          const previousLayouts = state.mobileLayoutUndoStack[state.mobileLayoutUndoStack.length - 1];
          const nextUndoStack = state.mobileLayoutUndoStack.slice(0, -1);
          const layoutsByMode = {
            ...state.layoutsByMode,
            mobile: cloneLayouts(previousLayouts),
          };
          saveLayoutsToServer(layoutsByMode);

          return {
            layoutsByMode,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, state.widgetConfigs),
            mobileLayoutUndoStack: nextUndoStack,
            canUndoMobileLayout: nextUndoStack.length > 0,
            canRestoreMobileLayout:
              !!state.mobileLayoutSessionBaseline &&
              !areLayoutsEqual(layoutsByMode.mobile, state.mobileLayoutSessionBaseline),
          };
        }),
      restoreMobileLayoutBaseline: () =>
        set((state) => {
          if (!state.mobileLayoutSessionBaseline) {
            return state;
          }

          const baseline = cloneLayouts(state.mobileLayoutSessionBaseline);
          const layoutsByMode = {
            ...state.layoutsByMode,
            mobile: baseline,
          };
          saveLayoutsToServer(layoutsByMode);

          return {
            layoutsByMode,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, state.widgetConfigs),
            mobileLayoutUndoStack: [],
            canUndoMobileLayout: false,
            canRestoreMobileLayout: false,
          };
        }),
      fetchWidgets: async () => {
        try {
          const [layoutsRes, configsRes] = await Promise.all([
            fetch(`/api/widget-layouts?t=${Date.now()}`, {
              cache: 'no-store',
            }),
            fetch(`/api/widget-configs?t=${Date.now()}`, {
              cache: 'no-store',
            }),
          ]);

          if (!layoutsRes.ok) {
            throw new Error(`Failed to fetch widget layouts: ${layoutsRes.status}`);
          }

          if (!configsRes.ok) {
            throw new Error(`Failed to fetch widget configs: ${configsRes.status}`);
          }

          const serverVersion = parseServerVersion(layoutsRes.headers.get('X-Data-Version')) ?? 0;
          const currentVersion = get().dataVersion ?? 0;

          if (serverVersion !== currentVersion) {
            const [layoutsData, configsData] = await Promise.all([layoutsRes.json(), configsRes.json()]);
            const layoutsByMode = ensureLayoutsByMode(layoutsData, initialWidgets);
            const widgetConfigs = WidgetConfigsArraySchema.parse(configsData);

            set((state) => ({
              layoutsByMode,
              widgetConfigs,
              widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs),
              dataVersion: serverVersion,
              canRestoreMobileLayout:
                !!state.mobileLayoutSessionBaseline &&
                !areLayoutsEqual(layoutsByMode.mobile, state.mobileLayoutSessionBaseline),
            }));
          }
        } catch (error) {
          console.error('Failed to fetch widgets:', error);
        }
      },
      saveWidgetConfigs: async () => {
        try {
          await saveConfigsToServer(get().widgetConfigs);
          return true;
        } catch (error) {
          console.error('Failed to save widget configs:', error);
          return false;
        }
      },
      addWidget: (widget) =>
        set((state) => {
          const mergedWidgets = validateWidgets([...state.widgets, widget]);
          const widgetConfigs = splitWidgets(mergedWidgets).configs;
          const layoutMode = state.activeLayoutMode;
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const layoutsByMode = {
            ...state.layoutsByMode,
            [layoutMode]: normalizeLayoutsForMode(
              [
                ...state.layoutsByMode[layoutMode],
                {
                  id: widget.id,
                  type: widget.type,
                  size: widget.size,
                  position: widget.position,
                },
              ],
              LAYOUT_MODE_COLUMNS[layoutMode]
            ),
          };
          const mobileSessionState =
            layoutMode === 'mobile'
              ? getMobileLayoutSessionState(layoutsByMode.mobile, state, previousMobileLayouts)
              : {
                  mobileLayoutUndoStack: state.mobileLayoutUndoStack,
                  mobileLayoutSessionBaseline: state.mobileLayoutSessionBaseline,
                  canUndoMobileLayout: state.canUndoMobileLayout,
                  canRestoreMobileLayout: state.canRestoreMobileLayout,
                };
          saveLayoutsToServer(layoutsByMode);
          void saveConfigsToServer(widgetConfigs);

          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs),
            ...mobileSessionState,
          };
        }),
      removeWidget: (id) =>
        set((state) => {
          const layoutMode = state.activeLayoutMode;
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const layoutsByMode = {
            ...state.layoutsByMode,
            [layoutMode]: state.layoutsByMode[layoutMode].filter((widget) => widget.id !== id),
          };
          const widgetConfigs = layoutContainsWidget(layoutsByMode, id)
            ? state.widgetConfigs
            : state.widgetConfigs.filter((widget) => widget.id !== id);
          const mobileSessionState =
            layoutMode === 'mobile'
              ? getMobileLayoutSessionState(layoutsByMode.mobile, state, previousMobileLayouts)
              : {
                  mobileLayoutUndoStack: state.mobileLayoutUndoStack,
                  mobileLayoutSessionBaseline: state.mobileLayoutSessionBaseline,
                  canUndoMobileLayout: state.canUndoMobileLayout,
                  canRestoreMobileLayout: state.canRestoreMobileLayout,
                };
          saveLayoutsToServer(layoutsByMode);
          void saveConfigsToServer(widgetConfigs);

          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs, []),
            ...mobileSessionState,
          };
        }),
      updateWidget: (id, data) =>
        set((state): Partial<WidgetState> => {
          const layoutMode = state.activeLayoutMode;
          const currentWidget = state.widgets.find((item) => item.id === id);
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const nextLayouts = state.layoutsByMode[layoutMode].map((widget) => {
            if (widget.id !== id) {
              return widget;
            }

            const updatedLayout = {
              ...widget,
              size: data.size ?? widget.size,
              position: data.position ?? widget.position,
            };

            return updatedLayout;
          });
          const layoutsByMode = ensureLayoutsByMode(
            {
              ...state.layoutsByMode,
              [layoutMode]: nextLayouts,
            },
            state.widgets
          );
          const widgetConfigs: WidgetConfigEntry[] = updateWidgetConfigEntry(
            state.widgetConfigs,
            currentWidget,
            data.config
          );
          const mobileSessionState =
            layoutMode === 'mobile' && (data.position || data.size)
              ? getMobileLayoutSessionState(layoutsByMode.mobile, state, previousMobileLayouts)
              : {
                  mobileLayoutUndoStack: state.mobileLayoutUndoStack,
                  mobileLayoutSessionBaseline: state.mobileLayoutSessionBaseline,
                  canUndoMobileLayout: state.canUndoMobileLayout,
                  canRestoreMobileLayout:
                    !!state.mobileLayoutSessionBaseline &&
                    !areLayoutsEqual(layoutsByMode.mobile, state.mobileLayoutSessionBaseline),
                };

          if (data.position || data.size) {
            saveLayoutsToServer(layoutsByMode);
          }

          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(layoutMode, layoutsByMode, widgetConfigs),
            ...mobileSessionState,
          };
        }),
      setWidgets: (widgets) => {
        const parsedWidgets = validateWidgets(widgets, []);
        const layoutsByMode = ensureLayoutsByMode(parsedWidgets, parsedWidgets);
        const widgetConfigs = splitWidgets(parsedWidgets).configs;
        saveLayoutsToServer(layoutsByMode);
        void saveConfigsToServer(widgetConfigs);
        set((state) => ({
          layoutsByMode,
          widgetConfigs,
          widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs, []),
          canRestoreMobileLayout:
            !!state.mobileLayoutSessionBaseline &&
            !areLayoutsEqual(layoutsByMode.mobile, state.mobileLayoutSessionBaseline),
        }));
      },
      batchUpdatePositions: (updates) =>
        set((state) => {
          const positionMap = new Map(updates.map((update) => [update.id, update.position]));
          const layoutMode = state.activeLayoutMode;
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const layoutsByMode = {
            ...state.layoutsByMode,
            [layoutMode]: state.layoutsByMode[layoutMode].map((widget) => {
              const position = positionMap.get(widget.id);
              return position ? { ...widget, position } : widget;
            }),
          };
          const mobileSessionState =
            layoutMode === 'mobile'
              ? getMobileLayoutSessionState(layoutsByMode.mobile, state, previousMobileLayouts)
              : {
                  mobileLayoutUndoStack: state.mobileLayoutUndoStack,
                  mobileLayoutSessionBaseline: state.mobileLayoutSessionBaseline,
                  canUndoMobileLayout: state.canUndoMobileLayout,
                  canRestoreMobileLayout: state.canRestoreMobileLayout,
                };
          saveLayoutsToServer(layoutsByMode);
          return {
            layoutsByMode,
            widgets: hydrateWidgets(layoutMode, layoutsByMode, state.widgetConfigs),
            ...mobileSessionState,
          };
        }),
      addWidgetWithLayout: (newWidget, positionUpdates) =>
        set((state) => {
          const layoutMode = state.activeLayoutMode;
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const positionMap = new Map(positionUpdates.map((update) => [update.id, update.position]));
          const nextActiveLayouts = state.layoutsByMode[layoutMode].map((widget) => {
            const position = positionMap.get(widget.id);
            return position ? { ...widget, position } : widget;
          });
          nextActiveLayouts.push({
            id: newWidget.id,
            type: newWidget.type,
            size: newWidget.size,
            position: newWidget.position,
          });

          const mergedWidgets = validateWidgets([...state.widgets, newWidget], []);
          const widgetConfigs = splitWidgets(mergedWidgets).configs;
          const layoutsByMode = {
            ...state.layoutsByMode,
            [layoutMode]: normalizeLayoutsForMode(
              nextActiveLayouts,
              LAYOUT_MODE_COLUMNS[layoutMode]
            ),
          };
          const mobileSessionState =
            layoutMode === 'mobile'
              ? getMobileLayoutSessionState(layoutsByMode.mobile, state, previousMobileLayouts)
              : {
                  mobileLayoutUndoStack: state.mobileLayoutUndoStack,
                  mobileLayoutSessionBaseline: state.mobileLayoutSessionBaseline,
                  canUndoMobileLayout: state.canUndoMobileLayout,
                  canRestoreMobileLayout: state.canRestoreMobileLayout,
                };
          saveLayoutsToServer(layoutsByMode);
          void saveConfigsToServer(widgetConfigs);

          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(layoutMode, layoutsByMode, widgetConfigs),
            ...mobileSessionState,
          };
        }),
    }),
    {
      name: persistKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        widgets: state.widgets,
        widgetConfigs: state.widgetConfigs,
        layoutsByMode: state.layoutsByMode,
        dataVersion: state.dataVersion,
      }),
      merge: (persistedState, currentState) => {
        const parsed = WidgetStorePersistedStateSchema.safeParse(persistedState);

        if (!parsed.success) {
          return currentState;
        }

        const fallbackWidgets = validateWidgets(parsed.data.widgets, currentState.widgets);
        const fallbackConfigs = splitWidgets(fallbackWidgets).configs;
        const widgetConfigs = parsed.data.widgetConfigs ?? fallbackConfigs;
        const layoutsByMode = ensureLayoutsByMode(
          parsed.data.layoutsByMode ?? fallbackWidgets,
          fallbackWidgets
        );

        return {
          ...currentState,
          ...parsed.data,
          widgetConfigs,
          layoutsByMode,
          widgets: hydrateWidgets(
            currentState.activeLayoutMode,
            layoutsByMode,
            widgetConfigs,
            fallbackWidgets
          ),
        };
      },
    }
  )
);
