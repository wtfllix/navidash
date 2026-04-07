import {
  createDefaultSettings,
  normalizeSettings,
  normalizeWidgets,
  SettingsSchema,
  SettingsStorePersistedStateSchema,
  WidgetSchema,
  WidgetStorePersistedStateSchema,
} from '@/lib/schemas';
import { Widget } from '@/types';

describe('Zod Schemas', () => {
  it('should validate a correct widget', () => {
    const widget = {
      id: 'w1',
      type: 'clock',
      size: { w: 1, h: 1 },
      position: { x: 0, y: 0 },
      config: {},
    };
    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(true);
  });

  it('should validate a date widget', () => {
    const widget = {
      id: 'w2',
      type: 'date',
      size: { w: 1, h: 1 },
      position: { x: 0, y: 0 },
      config: {},
    };
    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(true);
  });

  it('should validate a links widget', () => {
    const widget = {
      id: 'w3',
      type: 'links',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        title: 'Work Links',
        links: [
          { id: 'l1', title: 'GitHub', url: 'https://github.com' },
          { id: 'l2', title: 'Notion', url: 'https://notion.so' },
        ],
        showLabels: true,
        iconSize: 'md',
      },
    };
    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(true);
  });

  it('should normalize links without a protocol', () => {
    const result = WidgetSchema.safeParse({
      id: 'w3-normalized',
      type: 'links',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        links: [{ id: 'l1', title: 'Baidu', url: 'www.baidu.com' }],
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect((result.data.config as { links: Array<{ id: string; title: string; url: string }> }).links).toEqual([
      { id: 'l1', title: 'Baidu', url: 'https://www.baidu.com' },
    ]);
  });

  it('should validate quick-link, memo, todo and photo-frame widgets', () => {
    const widgets = [
      {
        id: 'quick',
        type: 'quick-link',
        size: { w: 1, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          title: 'Docs',
          url: 'https://example.com/docs',
        },
      },
      {
        id: 'memo',
        type: 'memo',
        size: { w: 1, h: 1 },
        position: { x: 1, y: 0 },
        config: {
          content: 'Review layout regression cases',
          bgColor: '#fef08a',
          textColor: '#111827',
        },
      },
      {
        id: 'todo',
        type: 'todo',
        size: { w: 1, h: 2 },
        position: { x: 2, y: 0 },
        config: {
          todos: [{ id: 't1', text: 'Ship tests', completed: false }],
        },
      },
      {
        id: 'photo',
        type: 'photo-frame',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 1 },
        config: {
          images: ['https://example.com/image.png', 'https://example.com/cover.png'],
          autoplay: true,
          interval: 4000,
        },
      },
    ] satisfies Widget[];

    for (const widget of widgets) {
      expect(WidgetSchema.safeParse(widget).success).toBe(true);
    }
  });

  it('should validate widgets with strict empty configs', () => {
    const widgets = [
      {
        id: 'calendar',
        type: 'calendar',
        size: { w: 1, h: 2 },
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: 'rss',
        type: 'rss',
        size: { w: 1, h: 1 },
        position: { x: 1, y: 0 },
        config: {},
      },
      {
        id: 'monitor',
        type: 'monitor',
        size: { w: 1, h: 1 },
        position: { x: 2, y: 0 },
        config: {},
      },
    ] satisfies Widget[];

    for (const widget of widgets) {
      expect(WidgetSchema.safeParse(widget).success).toBe(true);
    }
  });

  it('should reject extra fields for widgets with strict empty configs', () => {
    const result = WidgetSchema.safeParse({
      id: 'calendar-bad',
      type: 'calendar',
      size: { w: 1, h: 2 },
      position: { x: 0, y: 0 },
      config: {
        title: 'Unexpected',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject an invalid links widget config', () => {
    const widget = {
      id: 'w4',
      type: 'links',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        title: 'Broken Links',
        iconSize: 'xl',
      },
    };

    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(false);
  });

  it('should reject weather config with unsupported auth type', () => {
    const widget = {
      id: 'w5',
      type: 'weather',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        city: 'Shanghai',
        weatherAuthType: 'header',
      },
    };

    const result = WidgetSchema.safeParse(widget);
    expect(result.success).toBe(false);
  });

  it('should normalize legacy weather auth types', () => {
    const result = WidgetSchema.safeParse({
      id: 'weather-legacy-auth',
      type: 'weather',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        city: 'Shanghai',
        weatherAuthType: 'bearer',
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect((result.data.config as { weatherAuthType?: 'apikey' | 'jwt' }).weatherAuthType).toBe(
      'jwt'
    );
  });

  it('should strip legacy weather api keys from widget config', () => {
    const result = WidgetSchema.safeParse({
      id: 'weather-legacy-key',
      type: 'weather',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        city: 'Shanghai',
        lat: 31.2304,
        lon: 121.4737,
        apiKey: 'legacy-key',
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.config).toEqual({
      city: 'Shanghai',
      lat: 31.2304,
      lon: 121.4737,
      weatherAuthType: undefined,
      weatherCustomHost: undefined,
      weatherSub: undefined,
    });
  });

  it('should normalize legacy photo-frame config', () => {
    const result = WidgetSchema.safeParse({
      id: 'photo-legacy',
      type: 'photo-frame',
      size: { w: 2, h: 2 },
      position: { x: 0, y: 0 },
      config: {
        imageUrl: ' https://example.com/legacy.png ',
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.config).toEqual({
      imageUrl: 'https://example.com/legacy.png',
      images: ['https://example.com/legacy.png'],
      autoplay: true,
      interval: 5000,
      shuffle: false,
    });
  });

  it('should validate settings payload', () => {
    const settings = {
      backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
      backgroundBlur: 0,
      backgroundOpacity: 0,
      backgroundSize: '24px 24px',
      backgroundRepeat: 'repeat',
      themeColor: '#3b82f6',
      customFavicon: '/favicon.svg',
      customTitle: 'Navidash',
      language: 'en',
    };

    const result = SettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
  });

  it('should merge partial settings with defaults', () => {
    const settings = normalizeSettings({
      themeColor: '#22c55e',
      customTitle: 'Custom Dash',
      language: 'zh',
    });

    expect(settings).toEqual({
      ...createDefaultSettings(),
      themeColor: '#22c55e',
      customTitle: 'Custom Dash',
      language: 'zh',
    });
  });

  it('should ignore legacy weather fields in settings payloads', () => {
    const settings = normalizeSettings({
      themeColor: '#22c55e',
      weatherApiKey: 'legacy-key',
      weatherCity: 'Shanghai',
    });

    expect(settings).toEqual({
      ...createDefaultSettings(),
      themeColor: '#22c55e',
    });
  });

  it('should fall back to defaults when settings payload is invalid', () => {
    const fallback = {
      ...createDefaultSettings(),
      customTitle: 'Safe Title',
    };

    const settings = normalizeSettings(
      {
        themeColor: '#22c55e',
        backgroundBlur: -1,
      },
      fallback
    );

    expect(settings).toEqual(fallback);
  });

  it('should fall back when widgets payload is invalid', () => {
    const fallback: Widget[] = [
      {
        id: 'fallback',
        type: 'clock',
        size: { w: 1, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
    ];

    const widgets = normalizeWidgets(
      [
        {
          id: 'bad',
          type: 'clock',
          size: { w: 0, h: 1 },
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      fallback
    );

    expect(widgets).toEqual(fallback);
  });

  it('should validate persisted widget store state with version metadata', () => {
    const state = {
      widgets: [
        {
          id: 'persisted',
          type: 'clock',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      dataVersion: 3,
    };

    const result = WidgetStorePersistedStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  it('should reject persisted widget store state when version is invalid', () => {
    const result = WidgetStorePersistedStateSchema.safeParse({
      widgets: [],
      dataVersion: -1,
    });

    expect(result.success).toBe(false);
  });

  it('should validate persisted settings store state with version metadata', () => {
    const result = SettingsStorePersistedStateSchema.safeParse({
      customTitle: 'NaviDash',
      language: 'zh',
      dataVersion: 2,
    });

    expect(result.success).toBe(true);
  });
});
