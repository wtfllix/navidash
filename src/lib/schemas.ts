import { z } from 'zod';
import {
  Bookmark,
  DEFAULT_SETTINGS,
  Settings,
  Widget,
  WidgetConfigEntry,
  WidgetLayout,
  WidgetLayoutsByMode,
  WidgetSnapshot,
} from '@/types';

function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function canonicalBookmarkUrl(value: string) {
  try {
    const url = new URL(normalizeLinkUrl(value));
    url.hash = '';
    return url.toString();
  } catch {
    return normalizeLinkUrl(value);
  }
}

const widgetSizeSchema = z.object({
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

const widgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const BookmarkSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    url: z.string().min(1).transform(canonicalBookmarkUrl),
    folder: z.string().min(1).optional(),
  })
  .strict();

const todayWidgetConfigSchema = z
  .object({
    apiKey: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().finite().optional(),
    lon: z.number().finite().optional(),
    weatherSub: z.string().optional(),
    weatherCustomHost: z.string().optional(),
    weatherAuthType: z.enum(['apikey', 'jwt', 'param', 'bearer']).optional(),
  })
  .strict()
  .transform((config) => ({
    city: config.city,
    lat: config.lat,
    lon: config.lon,
  }))
  .default({});

const linksWidgetConfigSchema = z
  .object({
    title: z.string().optional(),
    bookmarkIds: z.array(z.string().min(1)).optional(),
    links: z.array(BookmarkSchema).optional(),
    showLabels: z.boolean().optional(),
    iconSize: z.enum(['sm', 'md', 'lg']).optional(),
  })
  .strict()
  .default({});

const memoWidgetConfigSchema = z
  .object({
    content: z.string().optional(),
    bgColor: z.string().optional(),
    textColor: z.string().optional(),
  })
  .strict()
  .default({});

const f1WidgetConfigSchema = z
  .object({
    view: z.enum(['schedule', 'standings']).optional(),
    showPractice: z.boolean().optional(),
    showCountdown: z.boolean().optional(),
  })
  .strict()
  .transform((config) => ({
    view: config.view ?? 'schedule',
    showPractice: config.showPractice ?? false,
    showCountdown: config.showCountdown ?? true,
  }))
  .default({});

const komariWidgetConfigSchema = z
  .object({
    nodeId: z.string().uuid().optional(),
    showNetwork: z.boolean().optional(),
    refreshInterval: z.union([z.literal(5), z.literal(15), z.literal(30)]).optional(),
  })
  .strict()
  .transform((config) => ({
    nodeId: config.nodeId,
    showNetwork: config.showNetwork ?? true,
    refreshInterval: config.refreshInterval ?? 5,
  }))
  .default({});

const photoWidgetConfigSchema = z
  .object({
    images: z.array(z.string().min(1)).optional(),
    imageUrl: z.string().optional(),
    autoplay: z.boolean().optional(),
    interval: z.number().int().positive().optional(),
    shuffle: z.boolean().optional(),
  })
  .strict()
  .transform((config) => {
    const images =
      config.images?.map((item) => item.trim()).filter(Boolean) ??
      (config.imageUrl?.trim() ? [config.imageUrl.trim()] : undefined);

    return {
      ...config,
      images,
      imageUrl: config.imageUrl?.trim() || images?.[0],
      autoplay: config.autoplay ?? false,
      interval: config.interval ?? 5000,
      shuffle: config.shuffle ?? false,
    };
  })
  .default({});

const widgetBaseShape = {
  id: z.string().min(1),
  size: widgetSizeSchema,
  position: widgetPositionSchema,
};

const widgetLayoutBaseShape = {
  id: z.string().min(1),
  size: widgetSizeSchema,
  position: widgetPositionSchema,
};

export const WidgetSchema = z.discriminatedUnion('type', [
  z.object({
    ...widgetBaseShape,
    type: z.literal('today'),
    config: todayWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('links'),
    config: linksWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('memo'),
    config: memoWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('photo-frame'),
    config: photoWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('f1'),
    config: f1WidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('komari'),
    config: komariWidgetConfigSchema,
  }),
]);

const removedWidgetTypes = new Set([
  'clock',
  'weather',
  'date',
  'quick-link',
  'todo',
  'calendar',
  'rss',
  'monitor',
]);

function filterUnsupportedWidgetEntries(value: unknown) {
  if (!Array.isArray(value)) return value;
  return value.filter((entry) => {
    if (!entry || typeof entry !== 'object') return true;
    const type = (entry as { type?: unknown }).type;
    return typeof type !== 'string' || !removedWidgetTypes.has(type);
  });
}

export const WidgetsArraySchema = z.preprocess(
  filterUnsupportedWidgetEntries,
  z.array(WidgetSchema)
);

export const WidgetLayoutSchema = z.discriminatedUnion('type', [
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('today'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('links'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('memo'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('photo-frame'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('f1'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('komari'),
  }),
]);

export const WidgetLayoutsArraySchema = z.preprocess(
  filterUnsupportedWidgetEntries,
  z.array(WidgetLayoutSchema)
);

export const WidgetLayoutsByModeSchema = z
  .object({
    desktop: WidgetLayoutsArraySchema.default([]),
    mobile: WidgetLayoutsArraySchema.default([]),
  })
  .strict();

export const WidgetConfigEntrySchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('today'),
    config: todayWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('links'),
    config: linksWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('memo'),
    config: memoWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('photo-frame'),
    config: photoWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('f1'),
    config: f1WidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('komari'),
    config: komariWidgetConfigSchema,
  }),
]);

export const WidgetConfigsArraySchema = z.preprocess(
  filterUnsupportedWidgetEntries,
  z.array(WidgetConfigEntrySchema)
);

const WidgetSnapshotV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    layoutsByMode: WidgetLayoutsByModeSchema,
    configs: WidgetConfigsArraySchema,
  })
  .strict();

export const WidgetSnapshotSchema = z
  .object({
    schemaVersion: z.literal(2),
    revision: z.number().int().nonnegative(),
    layoutsByMode: WidgetLayoutsByModeSchema,
    configs: WidgetConfigsArraySchema,
    bookmarks: z.array(BookmarkSchema),
  })
  .strict();

export const StoredWidgetSnapshotSchema = z.union([
  WidgetSnapshotSchema,
  WidgetSnapshotV1Schema,
]);

export const WidgetSnapshotWriteSchema = WidgetSnapshotSchema.omit({
  revision: true,
}).extend({
  expectedRevision: z.number().int().nonnegative(),
});

export function migrateWidgetConfigsToBookmarks(
  configs: WidgetConfigEntry[],
  initialBookmarks: Bookmark[] = []
) {
  const bookmarks = BookmarkSchema.array().parse(initialBookmarks) as Bookmark[];
  const usedIds = new Set(bookmarks.map((bookmark) => bookmark.id));
  const bookmarkIdByUrl = new Map(
    bookmarks.map((bookmark) => [canonicalBookmarkUrl(bookmark.url), bookmark.id])
  );

  const createUniqueId = (preferred: string) => {
    let candidate = preferred;
    let suffix = 2;
    while (usedIds.has(candidate)) {
      candidate = `${preferred}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(candidate);
    return candidate;
  };

  const migratedConfigs = configs.map((entry): WidgetConfigEntry => {
    if (entry.type !== 'links') return entry;

    const { links = [], bookmarkIds = [], ...presentation } = entry.config;
    const nextIds = bookmarkIds.filter((id) => usedIds.has(id));

    for (const link of links) {
      const canonicalUrl = canonicalBookmarkUrl(link.url);
      let bookmarkId = bookmarkIdByUrl.get(canonicalUrl);

      if (!bookmarkId) {
        bookmarkId = createUniqueId(link.id || `bookmark-${bookmarks.length + 1}`);
        bookmarks.push({ ...link, id: bookmarkId, url: canonicalUrl });
        bookmarkIdByUrl.set(canonicalUrl, bookmarkId);
      }

      if (!nextIds.includes(bookmarkId)) nextIds.push(bookmarkId);
    }

    return {
      ...entry,
      config: {
        ...presentation,
        bookmarkIds: nextIds,
      },
    };
  });

  return { configs: migratedConfigs, bookmarks };
}

export function normalizeWidgetSnapshot(value: unknown): WidgetSnapshot {
  const snapshot = StoredWidgetSnapshotSchema.parse(value);
  const migrated = migrateWidgetConfigsToBookmarks(
    snapshot.configs as WidgetConfigEntry[],
    snapshot.schemaVersion === 2 ? (snapshot.bookmarks as Bookmark[]) : []
  );

  return WidgetSnapshotSchema.parse({
    schemaVersion: 2,
    revision: snapshot.revision,
    layoutsByMode: snapshot.layoutsByMode,
    ...migrated,
  }) as WidgetSnapshot;
}

const settingsShape = {
  backgroundImage: z.string(),
  backgroundBlur: z.number().min(0),
  backgroundOpacity: z.number().min(0),
  backgroundSize: z.string(),
  backgroundRepeat: z.string(),
  customFavicon: z.string(),
  customTitle: z.string(),
  language: z.string(),
};

export const SettingsSchema = z.object(settingsShape).strict();

export const SettingsNormalizationSchema = z.object(settingsShape).partial();

export const PartialSettingsSchema = SettingsNormalizationSchema;

export const WidgetStorePersistedStateSchema = z
  .object({
    widgets: WidgetsArraySchema.optional(),
    widgetConfigs: WidgetConfigsArraySchema.optional(),
    layoutsByMode: WidgetLayoutsByModeSchema.optional(),
    bookmarks: z.array(BookmarkSchema).optional(),
    revision: z.number().finite().nonnegative().optional(),
    dataVersion: z.number().finite().nonnegative().optional(),
  })
  .strict();

export const SettingsStorePersistedStateSchema = PartialSettingsSchema.extend({
  dataVersion: z.number().finite().nonnegative().optional(),
});

export function createDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}

export function normalizeWidgets(data: unknown, fallback: Widget[] = []): Widget[] {
  const result = WidgetsArraySchema.safeParse(data);
  return result.success ? (result.data as Widget[]) : fallback;
}

export function splitWidgets(widgets: Widget[]): {
  layouts: WidgetLayout[];
  configs: WidgetConfigEntry[];
} {
  return {
    layouts: widgets.map(({ config: _config, ...layout }) => layout) as WidgetLayout[],
    configs: widgets.map(({ id, type, config }) => ({ id, type, config })) as WidgetConfigEntry[],
  };
}

export function splitWidgetsByMode(
  widgetsByMode: WidgetLayoutsByMode,
  configs: WidgetConfigEntry[]
): Widget[] {
  return mergeWidgets(widgetsByMode.desktop, configs, []);
}

export function mergeWidgets(
  layouts: WidgetLayout[],
  configs: WidgetConfigEntry[],
  fallback: Widget[] = []
): Widget[] {
  const configMap = new Map(configs.map((entry) => [entry.id, entry]));

  const merged = layouts.map((layout) => {
    const configEntry = configMap.get(layout.id);
    return {
      ...layout,
      config: configEntry?.config ?? {},
    };
  });

  return normalizeWidgets(merged, fallback);
}

export function normalizeSettings(
  data: unknown,
  fallback: Settings = createDefaultSettings()
): Settings {
  const result = PartialSettingsSchema.safeParse(data);
  return result.success ? ({ ...fallback, ...result.data } as Settings) : { ...fallback };
}
