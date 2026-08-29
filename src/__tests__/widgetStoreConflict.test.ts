import type { WidgetSnapshot } from '@/types';

const localSnapshot: WidgetSnapshot = {
  schemaVersion: 2,
  revision: 1,
  layoutsByMode: {
    desktop: [
      {
        id: 'memo-local',
        type: 'memo',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
      },
    ],
    mobile: [],
  },
  configs: [
    {
      id: 'memo-local',
      type: 'memo',
      config: { content: 'local change' },
    },
  ],
  bookmarks: [],
};

const serverSnapshot: WidgetSnapshot = {
  schemaVersion: 2,
  revision: 2,
  layoutsByMode: {
    desktop: [
      {
        id: 'memo-server',
        type: 'memo',
        size: { w: 2, h: 1 },
        position: { x: 2, y: 0 },
      },
    ],
    mobile: [],
  },
  configs: [
    {
      id: 'memo-server',
      type: 'memo',
      config: { content: 'server change' },
    },
  ],
  bookmarks: [],
};

describe('widget snapshot conflict recovery', () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
    window.localStorage.clear();
    jest.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemoMode;
    }
  });

  it('preserves the latest local data and retries only after the user keeps it', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'revision_conflict', snapshot: serverSnapshot }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => serverSnapshot,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...localSnapshot, revision: 3 }),
      });
    global.fetch = fetchMock as typeof fetch;

    const { useWidgetStore } = await import('@/store/useWidgetStore');
    useWidgetStore.setState({
      layoutsByMode: localSnapshot.layoutsByMode,
      widgetConfigs: localSnapshot.configs,
      bookmarks: localSnapshot.bookmarks,
      widgets: [
        {
          ...localSnapshot.layoutsByMode.desktop[0],
          config: localSnapshot.configs[0].config,
        },
      ],
      revision: localSnapshot.revision,
    });

    await expect(useWidgetStore.getState().saveWidgetConfigs()).resolves.toBe(false);
    expect(useWidgetStore.getState().revision).toBe(2);
    expect(useWidgetStore.getState().widgets[0].id).toBe('memo-local');
    expect(useWidgetStore.getState().snapshotConflict?.serverSnapshot).toEqual(serverSnapshot);

    useWidgetStore.getState().addBookmark({
      id: 'after-conflict',
      title: 'After conflict',
      url: 'https://example.com/after-conflict',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useWidgetStore.getState().snapshotConflict?.localSnapshot.bookmarks).toEqual([
      {
        id: 'after-conflict',
        title: 'After conflict',
        url: 'https://example.com/after-conflict',
      },
    ]);

    await useWidgetStore.getState().fetchWidgets();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useWidgetStore.getState().widgets[0].id).toBe('memo-local');
    expect(useWidgetStore.getState().snapshotConflict).not.toBeNull();

    await expect(
      useWidgetStore.getState().resolveSnapshotConflict('keep-local')
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[2][1]?.body as string)).toMatchObject({
      expectedRevision: 2,
      bookmarks: [
        {
          id: 'after-conflict',
          title: 'After conflict',
          url: 'https://example.com/after-conflict',
        },
      ],
    });
    expect(useWidgetStore.getState().revision).toBe(3);
    expect(useWidgetStore.getState().snapshotConflict).toBeNull();
  });

  it('replaces local data only after the user chooses the server version', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'revision_conflict', snapshot: serverSnapshot }),
    }) as typeof fetch;

    const { useWidgetStore } = await import('@/store/useWidgetStore');
    useWidgetStore.setState({
      layoutsByMode: localSnapshot.layoutsByMode,
      widgetConfigs: localSnapshot.configs,
      bookmarks: [],
      widgets: [
        {
          ...localSnapshot.layoutsByMode.desktop[0],
          config: localSnapshot.configs[0].config,
        },
      ],
      revision: localSnapshot.revision,
    });

    await useWidgetStore.getState().saveWidgetConfigs();
    await expect(
      useWidgetStore.getState().resolveSnapshotConflict('use-server')
    ).resolves.toBe(true);

    expect(useWidgetStore.getState().widgets).toEqual([
      {
        ...serverSnapshot.layoutsByMode.desktop[0],
        config: serverSnapshot.configs[0].config,
      },
    ]);
    expect(useWidgetStore.getState().revision).toBe(2);
    expect(useWidgetStore.getState().snapshotConflict).toBeNull();
  });
});
