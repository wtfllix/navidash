import { create } from 'zustand';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';
import {
  Bookmark,
  Widget,
  WidgetConfigEntry,
  WidgetLayoutMode,
  WidgetLayoutsByMode,
} from '@/types';
import {
  BookmarkSchema,
  migrateWidgetConfigsToBookmarks,
  normalizeWidgets,
  splitWidgets,
  WidgetConfigsArraySchema,
  WidgetLayoutsByModeSchema,
  WidgetSchema,
  WidgetStorePersistedStateSchema,
} from '@/lib/schemas';
import {
  DEFAULT_LAYOUT_MODE,
  ensureLayoutsByMode,
  LAYOUT_MODE_COLUMNS,
  mergeWidgetsForLayoutMode,
} from '@/lib/widgetLayouts';
import { canPlaceWidget } from '@/lib/layoutEngine';
import {
  DEMO_DATA_VERSION,
  DEMO_WIDGETS,
  DEMO_WIDGET_SNAPSHOT,
  isClientDemoMode,
} from '@/lib/demo';

type WidgetUpdate = Partial<Pick<Widget, 'size' | 'position' | 'config'>>;

interface WidgetState {
  widgets: Widget[];
  bookmarks: Bookmark[];
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
  addWidget: (widget: Widget) => boolean;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, data: WidgetUpdate) => boolean;
  setWidgets: (widgets: Widget[]) => void;
  replaceWidgetData: (layouts: unknown, configs: unknown, bookmarks?: unknown) => boolean;
  addBookmark: (bookmark: Omit<Bookmark, 'id'> & { id?: string }) => string | null;
  updateBookmark: (id: string, bookmark: Pick<Bookmark, 'title' | 'url'>) => boolean;
  removeBookmark: (id: string) => void;
  importBookmarks: (bookmarks: unknown) => number;
  resetWidgets: () => void;
  saveWidgetConfigs: () => Promise<boolean>;
  fetchWidgets: () => Promise<void>;
  revision?: number;
  batchUpdatePositions: (
    updates: Array<{ id: string; position: { x: number; y: number } }>
  ) => boolean;
  addWidgetWithLayout: (
    newWidget: Widget,
    positionUpdates: Array<{ id: string; position: { x: number; y: number } }>
  ) => boolean;
}

const initialWidgets: Widget[] = isClientDemoMode
  ? DEMO_WIDGETS
  : [];

const persistKey = 'widget-storage';

const memoryOnlyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function validateWidgets(widgets: unknown, fallback: Widget[] = initialWidgets): Widget[] {
  return normalizeWidgets(widgets, fallback);
}

function createBookmarkId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `bookmark-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

function canUseWidgetPlacement(widgets: Widget[], widget: Widget, cols: number) {
  return canPlaceWidget(
    widgets,
    widget.position.x,
    widget.position.y,
    widget.size.w,
    widget.size.h,
    cols,
    widget.id
  );
}

function areWidgetPlacementsValid(widgets: Widget[], cols: number) {
  return widgets.every((widget) => canUseWidgetPlacement(widgets, widget, cols));
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
  if (isClientDemoMode) {
    return ensureLayoutsByMode(DEMO_WIDGET_SNAPSHOT.layoutsByMode);
  }
  return ensureLayoutsByMode(initialWidgets, initialWidgets);
}

function getInitialWidgetConfigs(): WidgetConfigEntry[] {
  if (isClientDemoMode) {
    return WidgetConfigsArraySchema.parse(DEMO_WIDGET_SNAPSHOT.configs);
  }
  return migrateWidgetConfigsToBookmarks(splitWidgets(initialWidgets).configs).configs;
}

function getInitialBookmarks(): Bookmark[] {
  if (isClientDemoMode) {
    return BookmarkSchema.array().parse(DEMO_WIDGET_SNAPSHOT.bookmarks);
  }
  return migrateWidgetConfigsToBookmarks(splitWidgets(initialWidgets).configs).bookmarks;
}

function hydrateWidgets(
  layoutMode: WidgetLayoutMode,
  layoutsByMode: WidgetLayoutsByMode,
  widgetConfigs: WidgetConfigEntry[],
  fallback: Widget[] = initialWidgets
) {
  return mergeWidgetsForLayoutMode(layoutMode, layoutsByMode, widgetConfigs, fallback);
}

type PendingSnapshot = {
  layoutsByMode: WidgetLayoutsByMode;
  configs: WidgetConfigEntry[];
  bookmarks: Bookmark[];
};

let pendingSnapshot: PendingSnapshot | null = null;
let snapshotSaveTimeout: NodeJS.Timeout | null = null;
let snapshotSaveInFlight: Promise<boolean> | null = null;

function queueSnapshotSave(
  layoutsByMode: WidgetLayoutsByMode,
  configs: WidgetConfigEntry[],
  bookmarks: Bookmark[]
) {
  pendingSnapshot = { layoutsByMode, configs, bookmarks };
  if (snapshotSaveTimeout) clearTimeout(snapshotSaveTimeout);
  snapshotSaveTimeout = setTimeout(() => {
    snapshotSaveTimeout = null;
    void flushSnapshotSave();
  }, 500);
}

async function flushSnapshotSave(): Promise<boolean> {
  if (snapshotSaveTimeout) {
    clearTimeout(snapshotSaveTimeout);
    snapshotSaveTimeout = null;
  }

  if (snapshotSaveInFlight) {
    await snapshotSaveInFlight;
  }

  const snapshot = pendingSnapshot;
  if (!snapshot) return true;
  pendingSnapshot = null;

  const save = (async () => {
    try {
      const expectedRevision = useWidgetStore.getState().revision ?? 0;
      const response = await fetch('/api/widget-snapshot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemaVersion: 2,
          expectedRevision,
          layoutsByMode: snapshot.layoutsByMode,
          configs: snapshot.configs,
          bookmarks: snapshot.bookmarks,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          console.error('Widget snapshot revision conflict; local changes were not overwritten.');
          return false;
        }
        throw new Error(`Failed to save widget snapshot: ${response.status}`);
      }

      const data = await response.json();
      const revision = parseServerVersion(data?.revision);
      if (revision !== undefined) {
        useWidgetStore.setState({ revision });
      }
      return true;
    } catch (error) {
      console.error('Failed to save widget snapshot:', error);
      return false;
    }
  })();

  snapshotSaveInFlight = save;
  const saved = await save;
  snapshotSaveInFlight = null;

  if (pendingSnapshot && !snapshotSaveTimeout) {
    snapshotSaveTimeout = setTimeout(() => {
      snapshotSaveTimeout = null;
      void flushSnapshotSave();
    }, 0);
  }

  return saved;
}

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: initialWidgets,
      bookmarks: getInitialBookmarks(),
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

          if (!isClientDemoMode) {
            queueSnapshotSave(layoutsByMode, state.widgetConfigs, state.bookmarks);
          }

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

          if (!isClientDemoMode) {
            queueSnapshotSave(layoutsByMode, state.widgetConfigs, state.bookmarks);
          }

          return {
            layoutsByMode,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, state.widgetConfigs),
            mobileLayoutUndoStack: [],
            canUndoMobileLayout: false,
            canRestoreMobileLayout: false,
          };
        }),
      fetchWidgets: async () => {
        if (isClientDemoMode) {
          const demoLayoutsByMode = ensureLayoutsByMode(DEMO_WIDGET_SNAPSHOT.layoutsByMode);
          const demoWidgetConfigs = WidgetConfigsArraySchema.parse(DEMO_WIDGET_SNAPSHOT.configs);
          const demoBookmarks = BookmarkSchema.array().parse(DEMO_WIDGET_SNAPSHOT.bookmarks);

          set((state) => ({
            layoutsByMode: demoLayoutsByMode,
            widgetConfigs: demoWidgetConfigs,
            bookmarks: demoBookmarks,
            widgets: hydrateWidgets(
              state.activeLayoutMode,
              demoLayoutsByMode,
              demoWidgetConfigs,
              DEMO_WIDGETS
            ),
            revision: DEMO_DATA_VERSION,
            canRestoreMobileLayout:
              !!state.mobileLayoutSessionBaseline &&
              !areLayoutsEqual(demoLayoutsByMode.mobile, state.mobileLayoutSessionBaseline),
          }));
          return;
        }

        try {
          const response = await fetch(`/api/widget-snapshot?t=${Date.now()}`, {
            cache: 'no-store',
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch widget snapshot: ${response.status}`);
          }

          const snapshot = await response.json();
          const serverVersion = parseServerVersion(snapshot.revision) ?? 0;
          const currentVersion = get().revision ?? 0;

          if (serverVersion !== currentVersion) {
            const layoutsByMode = ensureLayoutsByMode(snapshot.layoutsByMode, initialWidgets);
            const widgetConfigs = WidgetConfigsArraySchema.parse(snapshot.configs);
            const bookmarks = BookmarkSchema.array().parse(snapshot.bookmarks);

            set((state) => ({
              layoutsByMode,
              widgetConfigs,
              bookmarks,
              widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs),
              revision: serverVersion,
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
        if (isClientDemoMode) {
          return true;
        }

        const state = get();
        queueSnapshotSave(state.layoutsByMode, state.widgetConfigs, state.bookmarks);
        return flushSnapshotSave();
      },
      addWidget: (widget) => {
        let accepted = false;
        set((state) => {
          const layoutMode = state.activeLayoutMode;
          if (!canUseWidgetPlacement(state.widgets, widget, LAYOUT_MODE_COLUMNS[layoutMode])) {
            return state;
          }

          const mergedWidgets = validateWidgets([...state.widgets, widget]);
          const widgetConfigs = splitWidgets(mergedWidgets).configs;
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const layoutsByMode = {
            ...state.layoutsByMode,
            [layoutMode]: [
              ...state.layoutsByMode[layoutMode],
              {
                id: widget.id,
                type: widget.type,
                size: widget.size,
                position: widget.position,
              },
            ],
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

          if (!isClientDemoMode) {
            queueSnapshotSave(layoutsByMode, widgetConfigs, state.bookmarks);
          }

          accepted = true;
          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs),
            ...mobileSessionState,
          };
        });
        return accepted;
      },
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

          if (!isClientDemoMode) {
            queueSnapshotSave(layoutsByMode, widgetConfigs, state.bookmarks);
          }

          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs, []),
            ...mobileSessionState,
          };
        }),
      updateWidget: (id, data) => {
        let accepted = false;
        set((state): Partial<WidgetState> => {
          const layoutMode = state.activeLayoutMode;
          const currentWidget = state.widgets.find((item) => item.id === id);
          if (!currentWidget) {
            return state;
          }

          const candidateWidget = mergeWidgetUpdate(currentWidget, data);
          if (
            (data.position || data.size) &&
            !canUseWidgetPlacement(
              state.widgets,
              candidateWidget,
              LAYOUT_MODE_COLUMNS[layoutMode]
            )
          ) {
            return state;
          }

          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const nextLayouts = state.layoutsByMode[layoutMode].map((widget) => {
            if (widget.id !== id) {
              return widget;
            }

            return {
              ...widget,
              size: data.size ?? widget.size,
              position: data.position ?? widget.position,
            };
          });
          const layoutsByMode = {
            ...state.layoutsByMode,
            [layoutMode]: nextLayouts,
          };
          const widgetConfigs = updateWidgetConfigEntry(state.widgetConfigs, currentWidget, data.config);
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

          if (!isClientDemoMode && (data.position || data.size)) {
            queueSnapshotSave(layoutsByMode, widgetConfigs, state.bookmarks);
          }

          accepted = true;
          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(layoutMode, layoutsByMode, widgetConfigs),
            ...mobileSessionState,
          };
        });
        return accepted;
      },
      setWidgets: (widgets) => {
        const parsedWidgets = validateWidgets(widgets, []);
        const layoutsByMode = ensureLayoutsByMode(parsedWidgets, parsedWidgets);
        const migrated = migrateWidgetConfigsToBookmarks(splitWidgets(parsedWidgets).configs);
        const widgetConfigs = migrated.configs;
        const bookmarks = migrated.bookmarks;

        if (!isClientDemoMode) {
          queueSnapshotSave(layoutsByMode, widgetConfigs, bookmarks);
        }

        set((state) => ({
          layoutsByMode,
          widgetConfigs,
          bookmarks,
          widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs, []),
          canRestoreMobileLayout:
            !!state.mobileLayoutSessionBaseline &&
            !areLayoutsEqual(layoutsByMode.mobile, state.mobileLayoutSessionBaseline),
          }));
      },
      replaceWidgetData: (layouts, configs, bookmarks = []) => {
        const parsedLayouts = WidgetLayoutsByModeSchema.safeParse(layouts);
        const parsedConfigs = WidgetConfigsArraySchema.safeParse(configs);
        const parsedBookmarks = BookmarkSchema.array().safeParse(bookmarks);

        if (!parsedLayouts.success || !parsedConfigs.success || !parsedBookmarks.success) {
          return false;
        }

        const layoutsByMode = ensureLayoutsByMode(parsedLayouts.data, initialWidgets);
        const migrated = migrateWidgetConfigsToBookmarks(
          parsedConfigs.data as WidgetConfigEntry[],
          parsedBookmarks.data as Bookmark[]
        );
        const widgetConfigs = migrated.configs;

        if (!isClientDemoMode) {
          queueSnapshotSave(layoutsByMode, widgetConfigs, migrated.bookmarks);
        }

        set((state) => ({
          layoutsByMode,
          widgetConfigs,
          bookmarks: migrated.bookmarks,
          widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs, []),
          mobileLayoutUndoStack: [],
          mobileLayoutSessionBaseline: null,
          isMobileLayoutSessionActive: false,
          canUndoMobileLayout: false,
          canRestoreMobileLayout: false,
        }));

        return true;
      },
      resetWidgets: () => {
        const layoutsByMode = getInitialLayoutsByMode();
        const widgetConfigs = getInitialWidgetConfigs();
        const bookmarks = getInitialBookmarks();

        if (!isClientDemoMode) {
          queueSnapshotSave(layoutsByMode, widgetConfigs, bookmarks);
        }

        set((state) => ({
          layoutsByMode,
          widgetConfigs,
          bookmarks,
          widgets: hydrateWidgets(state.activeLayoutMode, layoutsByMode, widgetConfigs),
          mobileLayoutUndoStack: [],
          mobileLayoutSessionBaseline: null,
          isMobileLayoutSessionActive: false,
          canUndoMobileLayout: false,
          canRestoreMobileLayout: false,
        }));
      },
      addBookmark: (bookmark) => {
        const parsed = BookmarkSchema.safeParse({
          ...bookmark,
          id: bookmark.id ?? createBookmarkId(),
        });
        if (!parsed.success) return null;

        const current = get();
        const duplicate = current.bookmarks.find(
          (item) => item.url === parsed.data.url
        );
        if (duplicate) return duplicate.id;

        const bookmarks = [...current.bookmarks, parsed.data as Bookmark];
        set({ bookmarks });
        if (!isClientDemoMode) {
          queueSnapshotSave(current.layoutsByMode, current.widgetConfigs, bookmarks);
        }
        return parsed.data.id;
      },
      updateBookmark: (id, bookmark) => {
        const current = get();
        const existing = current.bookmarks.find((item) => item.id === id);
        if (!existing) return false;
        const parsed = BookmarkSchema.safeParse({ ...existing, ...bookmark });
        if (!parsed.success) return false;

        const bookmarks = current.bookmarks.map((item) =>
          item.id === id ? (parsed.data as Bookmark) : item
        );
        set({ bookmarks });
        if (!isClientDemoMode) {
          queueSnapshotSave(current.layoutsByMode, current.widgetConfigs, bookmarks);
        }
        return true;
      },
      removeBookmark: (id) => {
        set((state) => {
          const bookmarks = state.bookmarks.filter((bookmark) => bookmark.id !== id);
          const widgetConfigs = state.widgetConfigs.map((entry) =>
            entry.type === 'links'
              ? {
                  ...entry,
                  config: {
                    ...entry.config,
                    bookmarkIds: (entry.config.bookmarkIds ?? []).filter(
                      (bookmarkId) => bookmarkId !== id
                    ),
                  },
                }
              : entry
          ) as WidgetConfigEntry[];

          if (!isClientDemoMode) {
            queueSnapshotSave(state.layoutsByMode, widgetConfigs, bookmarks);
          }

          return {
            bookmarks,
            widgetConfigs,
            widgets: hydrateWidgets(
              state.activeLayoutMode,
              state.layoutsByMode,
              widgetConfigs
            ),
          };
        });
      },
      importBookmarks: (value) => {
        const parsed = BookmarkSchema.array().safeParse(value);
        if (!parsed.success) return 0;

        const current = get();
        const byUrl = new Map(current.bookmarks.map((bookmark) => [bookmark.url, bookmark]));
        const usedIds = new Set(current.bookmarks.map((bookmark) => bookmark.id));
        let added = 0;
        for (const bookmark of parsed.data as Bookmark[]) {
          if (!byUrl.has(bookmark.url)) {
            const nextBookmark = usedIds.has(bookmark.id)
              ? { ...bookmark, id: createBookmarkId() }
              : bookmark;
            usedIds.add(nextBookmark.id);
            byUrl.set(nextBookmark.url, nextBookmark);
            added += 1;
          }
        }
        const bookmarks = Array.from(byUrl.values());
        set({ bookmarks });
        if (!isClientDemoMode) {
          queueSnapshotSave(current.layoutsByMode, current.widgetConfigs, bookmarks);
        }
        return added;
      },
      batchUpdatePositions: (updates) => {
        let accepted = false;
        set((state) => {
          const positionMap = new Map(updates.map((update) => [update.id, update.position]));
          const layoutMode = state.activeLayoutMode;
          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
          const nextWidgets = state.widgets.map((widget) => {
            const position = positionMap.get(widget.id);
            return position ? { ...widget, position } : widget;
          });

          if (!areWidgetPlacementsValid(nextWidgets, LAYOUT_MODE_COLUMNS[layoutMode])) {
            return state;
          }

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

          if (!isClientDemoMode) {
            queueSnapshotSave(layoutsByMode, state.widgetConfigs, state.bookmarks);
          }

          accepted = true;
          return {
            layoutsByMode,
            widgets: hydrateWidgets(layoutMode, layoutsByMode, state.widgetConfigs),
            ...mobileSessionState,
          };
        });
        return accepted;
      },
      addWidgetWithLayout: (newWidget, positionUpdates) => {
        let accepted = false;
        set((state) => {
          const layoutMode = state.activeLayoutMode;
          const positionMap = new Map(
            positionUpdates.map((update) => [update.id, update.position])
          );
          const nextWidgets = state.widgets.map((widget) => {
            const position = positionMap.get(widget.id);
            return position ? { ...widget, position } : widget;
          });
          nextWidgets.push(newWidget);

          if (!areWidgetPlacementsValid(nextWidgets, LAYOUT_MODE_COLUMNS[layoutMode])) {
            return state;
          }

          const previousMobileLayouts = cloneLayouts(state.layoutsByMode.mobile);
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
            [layoutMode]: nextActiveLayouts,
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

          if (!isClientDemoMode) {
            queueSnapshotSave(layoutsByMode, widgetConfigs, state.bookmarks);
          }

          accepted = true;
          return {
            layoutsByMode,
            widgetConfigs,
            widgets: hydrateWidgets(layoutMode, layoutsByMode, widgetConfigs),
            ...mobileSessionState,
          };
        });
        return accepted;
      },
    }),
    {
      name: persistKey,
      storage: createJSONStorage(() => (isClientDemoMode ? memoryOnlyStorage : localStorage)),
      partialize: (state) => ({
        widgetConfigs: state.widgetConfigs,
        layoutsByMode: state.layoutsByMode,
        bookmarks: state.bookmarks,
        revision: state.revision,
      }),
      merge: (persistedState, currentState) => {
        const parsed = WidgetStorePersistedStateSchema.safeParse(persistedState);

        if (!parsed.success) {
          return currentState;
        }

        const fallbackWidgets = validateWidgets(parsed.data.widgets, currentState.widgets);
        const fallbackConfigs = splitWidgets(fallbackWidgets).configs;
        const migrated = migrateWidgetConfigsToBookmarks(
          parsed.data.widgetConfigs ?? fallbackConfigs,
          parsed.data.bookmarks ?? []
        );
        const widgetConfigs = migrated.configs;
        const layoutsByMode = ensureLayoutsByMode(
          parsed.data.layoutsByMode ?? fallbackWidgets,
          fallbackWidgets
        );
        const { dataVersion: legacyDataVersion, ...persistedData } = parsed.data;

        return {
          ...currentState,
          ...persistedData,
          revision: persistedData.revision ?? legacyDataVersion,
          widgetConfigs,
          bookmarks: migrated.bookmarks,
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
