import {
  createDefaultSettings,
  normalizeSettings,
  normalizeWidgetSnapshot,
  normalizeWidgets,
  SettingsSchema,
  SettingsStorePersistedStateSchema,
  WidgetConfigsArraySchema,
  WidgetLayoutsArraySchema,
  WidgetSchema,
  WidgetStorePersistedStateSchema,
  WidgetsArraySchema,
} from '@/lib/schemas';
import { Widget } from '@/types';

describe('Zod Schemas', () => {
  it('should validate a today widget', () => {
    const widget = {
      id: 'w1',
      type: 'today',
      size: { w: 2, h: 2 },
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

  it('migrates schema v1 inline links into a deduplicated bookmark library', () => {
    const snapshot = normalizeWidgetSnapshot({
      schemaVersion: 1,
      revision: 7,
      layoutsByMode: { desktop: [], mobile: [] },
      configs: [
        {
          id: 'work',
          type: 'links',
          config: {
            links: [
              { id: 'docs', title: 'Docs', url: 'example.com/docs#intro' },
              { id: 'duplicate', title: 'Same Docs', url: 'https://example.com/docs#other' },
            ],
          },
        },
      ],
    });

    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.bookmarks).toEqual([
      { id: 'docs', title: 'Docs', url: 'https://example.com/docs' },
    ]);
    expect(snapshot.configs[0]).toMatchObject({
      type: 'links',
      config: { bookmarkIds: ['docs'] },
    });
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
      { id: 'l1', title: 'Baidu', url: 'https://www.baidu.com/' },
    ]);
  });

  it('should validate memo and photo-frame widgets', () => {
    const widgets = [
      {
        id: 'memo',
        type: 'memo',
        size: { w: 1, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          content: 'Review layout regression cases',
          bgColor: '#fef08a',
          textColor: '#111827',
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

  it('validates and defaults an F1 schedule widget', () => {
    const result = WidgetSchema.safeParse({
      id: 'f1-schedule',
      type: 'f1',
      size: { w: 2, h: 2 },
      position: { x: 0, y: 0 },
      config: {},
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.config).toEqual({ showPractice: false, showCountdown: true });
  });

  it('validates and defaults a single-node Komari widget', () => {
    const result = WidgetSchema.safeParse({
      id: 'komari-node',
      type: 'komari',
      size: { w: 2, h: 2 },
      position: { x: 0, y: 0 },
      config: { nodeId: '30529324-e285-4cbd-ae6a-7011f7bdcfa6' },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.config).toEqual({
      nodeId: '30529324-e285-4cbd-ae6a-7011f7bdcfa6',
      showNetwork: true,
      refreshInterval: 5,
    });
  });

  it('rejects Komari credentials, invalid node IDs, and unsupported refresh intervals', () => {
    for (const config of [
      { nodeId: 'not-a-uuid' },
      { refreshInterval: 10 },
      { refreshInterval: 60 },
      { apiKey: 'must-not-persist' },
    ]) {
      expect(
        WidgetSchema.safeParse({
          id: 'komari-invalid',
          type: 'komari',
          size: { w: 2, h: 2 },
          position: { x: 0, y: 0 },
          config,
        }).success
      ).toBe(false);
    }
  });

  it('should reject individual removed and unimplemented widget types', () => {
    for (const type of [
      'clock',
      'weather',
      'date',
      'quick-link',
      'todo',
      'calendar',
      'rss',
      'monitor',
    ]) {
      expect(
        WidgetSchema.safeParse({
          id: type,
          type,
          size: { w: 1, h: 1 },
          position: { x: 0, y: 0 },
          config: {},
        }).success
      ).toBe(false);
    }
  });

  it('should filter removed widgets from persisted arrays', () => {
    const widgets = WidgetsArraySchema.parse([
      {
        id: 'today',
        type: 'today',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: 'weather',
        type: 'weather',
        size: { w: 1, h: 1 },
        position: { x: 2, y: 0 },
        config: {},
      },
    ]);
    const layouts = WidgetLayoutsArraySchema.parse([
      {
        id: 'today',
        type: 'today',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 0 },
      },
      {
        id: 'clock',
        type: 'clock',
        size: { w: 1, h: 1 },
        position: { x: 2, y: 0 },
      },
    ]);
    const configs = WidgetConfigsArraySchema.parse([
      { id: 'today', type: 'today', config: {} },
      { id: 'todo', type: 'todo', config: {} },
    ]);

    expect(widgets.map((widget) => widget.id)).toEqual(['today']);
    expect(layouts.map((layout) => layout.id)).toEqual(['today']);
    expect(configs.map((config) => config.id)).toEqual(['today']);
  });

  it('should reject extra fields in strict widget configs', () => {
    const result = WidgetSchema.safeParse({
      id: 'memo-bad',
      type: 'memo',
      size: { w: 2, h: 1 },
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

  it('should reject today config with unsupported legacy auth type', () => {
    const widget = {
      id: 'w5',
      type: 'today',
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

  it('should remove legacy weather connection settings', () => {
    const result = WidgetSchema.safeParse({
      id: 'today-legacy-auth',
      type: 'today',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        city: 'Shanghai',
        apiKey: 'legacy-key',
        weatherCustomHost: 'legacy.example.com',
        weatherSub: 'custom',
        weatherAuthType: 'bearer',
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.config).toEqual({
      city: 'Shanghai',
      lat: undefined,
      lon: undefined,
    });
  });

  it('should validate today with weather configuration', () => {
    const result = WidgetSchema.safeParse({
      id: 'today-panel',
      type: 'today',
      size: { w: 2, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        city: 'Shanghai',
        lat: 31.2304,
        lon: 121.4737,
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.type).toBe('today');
  });

  it('should strip legacy weather api keys from widget config', () => {
    const result = WidgetSchema.safeParse({
      id: 'today-legacy-key',
      type: 'today',
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
      autoplay: false,
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
      customFavicon: '/favicon.svg',
      customTitle: 'Navidash',
      language: 'en',
    };

    const result = SettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
  });

  it('should merge partial settings with defaults', () => {
    const settings = normalizeSettings({
      customTitle: 'Custom Dash',
      language: 'zh',
    });

    expect(settings).toEqual({
      ...createDefaultSettings(),
      customTitle: 'Custom Dash',
      language: 'zh',
    });
  });

  it('should ignore removed theme and legacy weather fields in settings payloads', () => {
    const settings = normalizeSettings({
      themeColor: '#22c55e',
      weatherApiKey: 'legacy-key',
      weatherCity: 'Shanghai',
    });

    expect(settings).toEqual(createDefaultSettings());
  });

  it('should fall back to defaults when settings payload is invalid', () => {
    const fallback = {
      ...createDefaultSettings(),
      customTitle: 'Safe Title',
    };

    const settings = normalizeSettings(
      {
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
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
    ];

    const widgets = normalizeWidgets(
      [
        {
          id: 'bad',
          type: 'links',
          size: { w: 0, h: 1 },
          position: { x: 0, y: 0 },
          config: {},
        },
      ],
      fallback
    );

    expect(widgets).toEqual(fallback);
  });

  it('should validate the canonical persisted widget snapshot state', () => {
    const state = {
      layoutsByMode: {
        desktop: [
          {
            id: 'persisted',
            type: 'today',
            size: { w: 2, h: 2 },
            position: { x: 0, y: 0 },
          },
        ],
        mobile: [],
      },
      widgetConfigs: [
        {
          id: 'persisted',
          type: 'today',
          config: {},
        },
      ],
      revision: 3,
    };

    const result = WidgetStorePersistedStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  it('should reject persisted widget store state when version is invalid', () => {
    const result = WidgetStorePersistedStateSchema.safeParse({
      layoutsByMode: { desktop: [], mobile: [] },
      widgetConfigs: [],
      revision: -1,
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
