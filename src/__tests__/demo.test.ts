import { DEMO_SETTINGS, DEMO_WIDGET_SNAPSHOT } from '@/lib/demo';
import { WidgetSnapshotSchema } from '@/lib/schemas';

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
