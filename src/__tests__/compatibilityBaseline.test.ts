import fs from 'fs';
import path from 'path';
import {
  BookmarkSchema,
  normalizeWidgetSnapshot,
  SettingsSchema,
  WidgetConfigsArraySchema,
  WidgetLayoutsByModeSchema,
} from '@/lib/schemas';
import { parseLauncherUsageStore } from '@/lib/linkLauncherUsage';

const fixtureDir = path.join(process.cwd(), 'src/__tests__/fixtures/v0.7.3');

function readFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf-8'));
}

describe('v0.7.3 compatibility baseline', () => {
  it('reads the versioned settings contract', () => {
    const fixture = readFixture('settings.json') as {
      version?: unknown;
      data?: unknown;
    };

    expect(fixture.version).toBe(1);
    expect(SettingsSchema.parse(fixture.data)).toMatchObject({
      customTitle: 'NaviDash',
      backgroundSize: '24px 24px',
      backgroundRepeat: 'repeat',
    });
  });

  it('preserves the atomic snapshot, bookmark references, and independent placements', () => {
    const snapshot = normalizeWidgetSnapshot(readFixture('widget-snapshot.json'));
    const configIds = new Set(snapshot.configs.map((config) => config.id));
    const bookmarkIds = new Set(snapshot.bookmarks.map((bookmark) => bookmark.id));
    const linksConfig = snapshot.configs.find((config) => config.id === 'baseline-links');

    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.revision).toBe(18);
    expect(snapshot.layoutsByMode.desktop.every((layout) => configIds.has(layout.id))).toBe(true);
    expect(snapshot.layoutsByMode.mobile.every((layout) => configIds.has(layout.id))).toBe(true);
    expect(snapshot.layoutsByMode.desktop.find((layout) => layout.id === 'baseline-links')).toMatchObject({
      position: { x: 3, y: 0 },
    });
    expect(snapshot.layoutsByMode.mobile.find((layout) => layout.id === 'baseline-links')).toMatchObject({
      position: { x: 0, y: 2 },
    });
    expect(linksConfig?.type).toBe('links');

    if (linksConfig?.type === 'links') {
      expect(linksConfig.config.bookmarkIds?.every((id) => bookmarkIds.has(id))).toBe(true);
    }
  });

  it('reads the complete backup v3 contract', () => {
    const fixture = readFixture('backup-v3.json') as {
      version?: unknown;
      widgetLayoutsByMode?: unknown;
      widgetConfigs?: unknown;
      bookmarks?: unknown;
      launcherUsage?: unknown;
      settings?: unknown;
    };

    const layouts = WidgetLayoutsByModeSchema.parse(fixture.widgetLayoutsByMode);
    const configs = WidgetConfigsArraySchema.parse(fixture.widgetConfigs);
    const bookmarks = BookmarkSchema.array().parse(fixture.bookmarks);
    const settings = SettingsSchema.parse(fixture.settings);
    const launcherUsage = parseLauncherUsageStore(fixture.launcherUsage);

    expect(fixture.version).toBe(3);
    expect(layouts.desktop).toHaveLength(1);
    expect(layouts.mobile).toHaveLength(1);
    expect(configs[0]).toMatchObject({ id: 'baseline-links', type: 'links' });
    expect(bookmarks.map((bookmark) => bookmark.id)).toEqual([
      'baseline-github',
      'baseline-chatgpt',
    ]);
    expect(settings.customTitle).toBe('NaviDash');
    expect(launcherUsage.links['https://github.com/']).toMatchObject({
      totalCount: 3,
      queryStats: {
        g: {
          count: 2,
        },
      },
    });
  });
});
