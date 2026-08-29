import {
  DEMO_KOMARI_NODE_ID,
  DEMO_SETTINGS,
  DEMO_WIDGET_SNAPSHOT,
  getDemoF1Standings,
  getDemoKomariNode,
} from '@/lib/demo';
import { mergeWidgets, WidgetSnapshotSchema } from '@/lib/schemas';
import { isWidgetLayoutValid } from '@/lib/layoutEngine';
import { LAYOUT_MODE_COLUMNS } from '@/lib/widgetLayouts';

describe('demo configuration', () => {
  it('uses the current versioned widget snapshot without orphaned layouts', () => {
    const snapshot = WidgetSnapshotSchema.parse(DEMO_WIDGET_SNAPSHOT);
    const configIds = new Set(snapshot.configs.map((config) => config.id));

    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.bookmarks.length).toBeGreaterThan(0);

    for (const layouts of Object.values(snapshot.layoutsByMode)) {
      expect(new Set(layouts.map((layout) => layout.id)).size).toBe(layouts.length);
      expect(layouts.every((layout) => configIds.has(layout.id))).toBe(true);
    }

    for (const mode of ['desktop', 'mobile'] as const) {
      expect(
        isWidgetLayoutValid(
          mergeWidgets(snapshot.layoutsByMode[mode], snapshot.configs),
          LAYOUT_MODE_COLUMNS[mode]
        )
      ).toBe(true);
    }
  });

  it('showcases the latest F1 modes and Komari widget in both layouts', () => {
    const f1Configs = DEMO_WIDGET_SNAPSHOT.configs.filter((config) => config.type === 'f1');
    const komariConfig = DEMO_WIDGET_SNAPSHOT.configs.find(
      (config) => config.type === 'komari'
    );

    expect(f1Configs.map((config) => config.config.view).sort()).toEqual([
      'schedule',
      'standings',
    ]);
    expect(komariConfig?.config).toMatchObject({ nodeId: DEMO_KOMARI_NODE_ID });

    for (const layouts of Object.values(DEMO_WIDGET_SNAPSHOT.layoutsByMode)) {
      const ids = new Set(layouts.map((layout) => layout.id));
      expect(ids.has('demo-f1-schedule')).toBe(true);
      expect(ids.has('demo-f1-standings')).toBe(true);
      expect(ids.has('demo-komari')).toBe(true);
      expect(layouts.slice(0, 3).map((layout) => layout.id)).toEqual([
        'demo-f1-standings',
        'demo-f1-schedule',
        'demo-komari',
      ]);

      const latestIds = new Set(['demo-f1-schedule', 'demo-f1-standings', 'demo-komari']);
      const latestBottom = Math.max(
        ...layouts
          .filter((layout) => latestIds.has(layout.id))
          .map((layout) => layout.position.y + layout.size.h)
      );
      const legacyTop = Math.min(
        ...layouts
          .filter((layout) => !latestIds.has(layout.id))
          .map((layout) => layout.position.y)
      );
      expect(latestBottom).toBeLessThanOrEqual(legacyTop);
    }
  });

  it('provides deterministic demo data for F1 standings and Komari', () => {
    const standings = getDemoF1Standings();
    expect(standings).toMatchObject({
      season: 2026,
      round: 12,
      stale: false,
    });
    expect(standings.standings[0]).toMatchObject({ position: 1, code: 'ANT', points: 242 });
    expect(standings.standings).toHaveLength(23);
    expect(getDemoKomariNode()).toMatchObject({
      id: DEMO_KOMARI_NODE_ID,
      name: 'Tokyo Edge',
      online: true,
    });
  });

  it('stores Links references in the bookmark library instead of legacy inline links', () => {
    const linksConfigs = DEMO_WIDGET_SNAPSHOT.configs.filter(
      (config) => config.type === 'links'
    );

    expect(linksConfigs.length).toBeGreaterThan(0);
    expect(
      linksConfigs.every(
        (config) =>
          !('links' in config.config) &&
          Array.isArray(config.config.bookmarkIds) &&
          config.config.bookmarkIds.length > 0
      )
    ).toBe(true);
  });

  it('uses the visible dots background from the current test configuration', () => {
    expect(DEMO_SETTINGS).toMatchObject({
      backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
      backgroundSize: '24px 24px',
      backgroundRepeat: 'repeat',
    });
  });
});
