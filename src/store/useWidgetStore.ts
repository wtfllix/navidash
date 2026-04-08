import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Widget } from '@/types';
import {
  normalizeWidgets,
  splitWidgets,
  WidgetSchema,
  WidgetsArraySchema,
  WidgetStorePersistedStateSchema,
} from '@/lib/schemas';
import { DEMO_DATA_VERSION, DEMO_WIDGETS, isClientDemoMode } from '@/lib/demo';

type WidgetUpdate = Partial<Pick<Widget, 'size' | 'position' | 'config'>>;

interface WidgetState {
  widgets: Widget[];
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

const initialWidgets: Widget[] = isClientDemoMode
  ? DEMO_WIDGETS
  : [
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

let saveTimeout: NodeJS.Timeout | null = null;

const saveLayoutsToServer = (widgets: Widget[]) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  const parsedWidgets = validateWidgets(widgets, []);
  const layouts = splitWidgets(parsedWidgets).layouts;

  saveTimeout = setTimeout(async () => {
    try {
      const res = await fetch('/api/widget-layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layouts),
      });

      if (!res.ok) {
        throw new Error(`Failed to save widgets: ${res.status}`);
      }

      const data = await res.json();
      const version = parseServerVersion(data?.version);

      if (version !== undefined) {
        useWidgetStore.setState({ dataVersion: version });
      }
    } catch (error) {
      console.error('Failed to save widgets:', error);
    } finally {
      saveTimeout = null;
    }
  }, 1000);
};

const saveConfigsToServer = async (widgets: Widget[]) => {
  const parsedWidgets = validateWidgets(widgets, []);
  const configs = splitWidgets(parsedWidgets).configs;

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
      fetchWidgets: async () => {
        if (isClientDemoMode) {
          set({ widgets: DEMO_WIDGETS, dataVersion: DEMO_DATA_VERSION });
          return;
        }

        try {
          const res = await fetch(`/api/widgets?t=${Date.now()}`, {
            cache: 'no-store',
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch widgets: ${res.status}`);
          }

          const serverVersion = parseServerVersion(res.headers.get('X-Data-Version')) ?? 0;
          const currentVersion = get().dataVersion ?? 0;

          if (serverVersion !== currentVersion) {
            const data = await res.json();
            const parsedWidgets = validateWidgets(data, []);
            set({ widgets: parsedWidgets, dataVersion: serverVersion });
          }
        } catch (error) {
          console.error('Failed to fetch widgets:', error);
        }
      },
      saveWidgetConfigs: async () => {
        if (isClientDemoMode) {
          return false;
        }

        try {
          await saveConfigsToServer(get().widgets);
          return true;
        } catch (error) {
          console.error('Failed to save widget configs:', error);
          return false;
        }
      },
      addWidget: (widget) =>
        set((state) => {
          if (isClientDemoMode) {
            return state;
          }

          const newWidgets = WidgetsArraySchema.parse([...state.widgets, widget]);
          saveLayoutsToServer(newWidgets);
          void saveConfigsToServer(newWidgets);
          return { widgets: newWidgets };
        }),
      removeWidget: (id) =>
        set((state) => {
          if (isClientDemoMode) {
            return state;
          }

          const newWidgets = state.widgets.filter((widget) => widget.id !== id);
          saveLayoutsToServer(newWidgets);
          void saveConfigsToServer(newWidgets);
          return { widgets: newWidgets };
        }),
      updateWidget: (id, data) =>
        set((state) => {
          if (isClientDemoMode) {
            return state;
          }

          const newWidgets = state.widgets.map((widget) =>
            widget.id === id ? mergeWidgetUpdate(widget, data) : widget
          );

          if (data.position || data.size) {
            saveLayoutsToServer(newWidgets);
          }

          return { widgets: newWidgets };
        }),
      setWidgets: (widgets) => {
        if (isClientDemoMode) {
          set({ widgets: DEMO_WIDGETS, dataVersion: DEMO_DATA_VERSION });
          return;
        }

        const parsedWidgets = validateWidgets(widgets, []);
        saveLayoutsToServer(parsedWidgets);
        void saveConfigsToServer(parsedWidgets);
        set({ widgets: parsedWidgets });
      },
      batchUpdatePositions: (updates) =>
        set((state) => {
          if (isClientDemoMode) {
            return state;
          }

          const positionMap = new Map(updates.map((update) => [update.id, update.position]));
          const newWidgets = state.widgets.map((widget) => {
            const position = positionMap.get(widget.id);
            return position ? mergeWidgetUpdate(widget, { position }) : widget;
          });
          saveLayoutsToServer(newWidgets);
          return { widgets: newWidgets };
        }),
      addWidgetWithLayout: (newWidget, positionUpdates) =>
        set((state) => {
          if (isClientDemoMode) {
            return state;
          }

          const positionMap = new Map(positionUpdates.map((update) => [update.id, update.position]));
          const updatedWidgets = state.widgets.map((widget) => {
            const position = positionMap.get(widget.id);
            return position ? mergeWidgetUpdate(widget, { position }) : widget;
          });
          const newWidgets = WidgetsArraySchema.parse([...updatedWidgets, newWidget]);
          saveLayoutsToServer(newWidgets);
          void saveConfigsToServer(newWidgets);
          return { widgets: newWidgets };
        }),
    }),
    {
      name: persistKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        widgets: state.widgets,
        dataVersion: state.dataVersion,
      }),
      merge: (persistedState, currentState) => {
        const parsed = WidgetStorePersistedStateSchema.safeParse(persistedState);

        if (!parsed.success) {
          return currentState;
        }

        if (isClientDemoMode) {
          return {
            ...currentState,
            widgets: DEMO_WIDGETS,
            dataVersion: DEMO_DATA_VERSION,
          };
        }

        return {
          ...currentState,
          ...parsed.data,
          widgets: validateWidgets(parsed.data.widgets, currentState.widgets),
        };
      },
    }
  )
);
