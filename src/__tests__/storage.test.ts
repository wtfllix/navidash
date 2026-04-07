import fs from 'fs/promises';
import os from 'os';
import path from 'path';

describe('storage versioned files', () => {
  const originalDataDir = process.env.DATA_DIR;
  const originalDemoMode = process.env.DEMO_MODE;
  const originalPublicDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

  let tempDir: string;

  beforeEach(async () => {
    jest.resetModules();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'navidash-storage-'));
    process.env.DATA_DIR = tempDir;
    process.env.DEMO_MODE = 'false';
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });

    if (originalDataDir === undefined) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = originalDataDir;
    }

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    if (originalPublicDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalPublicDemoMode;
    }
  });

  it('writes settings in a versioned envelope and reads them back', async () => {
    const { saveSettings, getSettings } = await import('@/lib/server/storage');
    const { createDefaultSettings } = await import('@/lib/schemas');

    const settings = {
      ...createDefaultSettings(),
      customTitle: 'Versioned NaviDash',
      language: 'zh',
    };

    await saveSettings(settings);

    const raw = JSON.parse(await fs.readFile(path.join(tempDir, 'settings.json'), 'utf-8'));
    expect(raw).toEqual({
      version: 1,
      data: settings,
    });

    await expect(getSettings()).resolves.toEqual(settings);
  });

  it('reads legacy raw widget layout/config files for backward compatibility', async () => {
    const { getWidgets } = await import('@/lib/server/storage');

    await fs.writeFile(
      path.join(tempDir, 'widget-layouts.json'),
      JSON.stringify(
        [
          {
            id: 'legacy-links',
            type: 'links',
            size: { w: 2, h: 1 },
            position: { x: 0, y: 0 },
          },
        ],
        null,
        2
      )
    );

    await fs.writeFile(
      path.join(tempDir, 'widget-configs.json'),
      JSON.stringify(
        [
          {
            id: 'legacy-links',
            type: 'links',
            config: {
              links: [{ id: 'l1', title: 'Legacy Link', url: 'legacy.example.com' }],
            },
          },
        ],
        null,
        2
      )
    );

    await expect(getWidgets()).resolves.toEqual([
      {
        id: 'legacy-links',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {
          links: [{ id: 'l1', title: 'Legacy Link', url: 'https://legacy.example.com' }],
        },
      },
    ]);
  });

  it('reads legacy settings files and drops weather-specific fields', async () => {
    const { getSettings } = await import('@/lib/server/storage');

    await fs.writeFile(
      path.join(tempDir, 'settings.json'),
      JSON.stringify(
        {
          backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
          backgroundBlur: 0,
          backgroundOpacity: 0,
          backgroundSize: '24px 24px',
          backgroundRepeat: 'repeat',
          themeColor: '#22c55e',
          customFavicon: '/favicon.svg',
          customTitle: 'Legacy Settings',
          language: 'zh',
          weatherApiKey: 'legacy-key',
          weatherCity: 'Shanghai',
        },
        null,
        2
      )
    );

    await expect(getSettings()).resolves.toEqual({
      backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
      backgroundBlur: 0,
      backgroundOpacity: 0,
      backgroundSize: '24px 24px',
      backgroundRepeat: 'repeat',
      themeColor: '#22c55e',
      customFavicon: '/favicon.svg',
      customTitle: 'Legacy Settings',
      language: 'zh',
    });
  });
});
