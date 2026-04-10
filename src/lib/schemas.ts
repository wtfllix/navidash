import { z } from 'zod';
import {
  DEFAULT_SETTINGS,
  Settings,
  Widget,
  WidgetConfigEntry,
  WidgetLayout,
  WidgetLayoutsByMode,
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

function normalizeWeatherAuthType(value: string | undefined): 'apikey' | 'jwt' | undefined {
  if (!value) {
    return undefined;
  }

  if (value === 'apikey' || value === 'param') {
    return 'apikey';
  }

  if (value === 'jwt' || value === 'bearer') {
    return 'jwt';
  }

  return undefined;
}

const widgetSizeSchema = z.object({
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

const widgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

const emptyConfigSchema = z.object({}).strict().default({});

const linkItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1).transform(normalizeLinkUrl),
});

const clockWidgetConfigSchema = z
  .object({
    clockStyle: z.enum(['glass', 'minimal', 'bento', 'digital', 'analog', 'flip', 'apple']).optional(),
  })
  .strict()
  .default({});

const weatherWidgetConfigSchema = z
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
    weatherSub: config.weatherSub,
    weatherCustomHost: config.weatherCustomHost?.trim() || undefined,
    weatherAuthType: normalizeWeatherAuthType(config.weatherAuthType),
  }))
  .default({});

const dateWidgetConfigSchema = z
  .object({
    style: z.enum(['classic', 'minimal', 'glass', 'bauhaus']).optional(),
    color: z.string().optional(),
  })
  .strict()
  .default({});

const quickLinkWidgetConfigSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
  })
  .strict()
  .default({});

const linksWidgetConfigSchema = z
  .object({
    title: z.string().optional(),
    links: z.array(linkItemSchema).optional(),
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

const todoWidgetConfigSchema = z
  .object({
    todos: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string(),
          completed: z.boolean(),
        })
      )
      .optional(),
  })
  .strict()
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
      autoplay: config.autoplay ?? true,
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
    type: z.literal('clock'),
    config: clockWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('weather'),
    config: weatherWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('date'),
    config: dateWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('quick-link'),
    config: quickLinkWidgetConfigSchema,
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
    type: z.literal('todo'),
    config: todoWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('photo-frame'),
    config: photoWidgetConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('calendar'),
    config: emptyConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('rss'),
    config: emptyConfigSchema,
  }),
  z.object({
    ...widgetBaseShape,
    type: z.literal('monitor'),
    config: emptyConfigSchema,
  }),
]);

export const WidgetsArraySchema = z.array(WidgetSchema);

export const WidgetLayoutSchema = z.discriminatedUnion('type', [
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('clock'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('weather'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('date'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('quick-link'),
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
    type: z.literal('todo'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('photo-frame'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('calendar'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('rss'),
  }),
  z.object({
    ...widgetLayoutBaseShape,
    type: z.literal('monitor'),
  }),
]);

export const WidgetLayoutsArraySchema = z.array(WidgetLayoutSchema);

export const WidgetLayoutsByModeSchema = z
  .object({
    desktop: WidgetLayoutsArraySchema.default([]),
    mobile: WidgetLayoutsArraySchema.default([]),
  })
  .strict();

export const WidgetConfigEntrySchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('clock'),
    config: clockWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('weather'),
    config: weatherWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('date'),
    config: dateWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('quick-link'),
    config: quickLinkWidgetConfigSchema,
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
    type: z.literal('todo'),
    config: todoWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('photo-frame'),
    config: photoWidgetConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('calendar'),
    config: emptyConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('rss'),
    config: emptyConfigSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('monitor'),
    config: emptyConfigSchema,
  }),
]);

export const WidgetConfigsArraySchema = z.array(WidgetConfigEntrySchema);

const settingsShape = {
  backgroundImage: z.string(),
  backgroundBlur: z.number().min(0),
  backgroundOpacity: z.number().min(0),
  backgroundSize: z.string(),
  backgroundRepeat: z.string(),
  themeColor: z.string(),
  customFavicon: z.string(),
  customTitle: z.string(),
  language: z.string(),
};

export const SettingsSchema = z.object(settingsShape).strict();

export const SettingsNormalizationSchema = z.object(settingsShape).partial();

export const PartialSettingsSchema = SettingsNormalizationSchema;

export const WidgetStorePersistedStateSchema = z
  .object({
    widgets: WidgetsArraySchema,
    widgetConfigs: WidgetConfigsArraySchema.optional(),
    layoutsByMode: WidgetLayoutsByModeSchema.optional(),
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
