describe('widget store backup restore', () => {
  const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    jest.resetModules();
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemoMode;
    }
  });

  it('preserves independent desktop and mobile placements', async () => {
    const { useWidgetStore } = await import('@/store/useWidgetStore');
    const layouts = {
      desktop: [
        {
          id: 'link-1',
          type: 'links' as const,
          size: { w: 1, h: 1 },
          position: { x: 4, y: 1 },
        },
      ],
      mobile: [
        {
          id: 'link-1',
          type: 'links' as const,
          size: { w: 1, h: 1 },
          position: { x: 1, y: 3 },
        },
      ],
    };
    const configs = [
      {
        id: 'link-1',
        type: 'links' as const,
        config: {
          links: [{ id: 'docs', title: 'Docs', url: 'https://example.com' }],
        },
      },
    ];

    expect(useWidgetStore.getState().replaceWidgetData(layouts, configs)).toBe(true);
    expect(useWidgetStore.getState().layoutsByMode).toEqual(layouts);
    expect(useWidgetStore.getState().widgets[0]).toMatchObject({
      id: 'link-1',
      position: { x: 4, y: 1 },
      config: {
        bookmarkIds: ['docs'],
      },
    });
    expect(useWidgetStore.getState().bookmarks).toEqual([
      { id: 'docs', title: 'Docs', url: 'https://example.com/' },
    ]);
  });

  it('rejects resize, move, and add operations that collide', async () => {
    const { useWidgetStore } = await import('@/store/useWidgetStore');
    const widgets = [
      {
        id: 'left',
        type: 'links' as const,
        size: { w: 2, h: 1 },
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: 'right',
        type: 'memo' as const,
        size: { w: 2, h: 1 },
        position: { x: 2, y: 0 },
        config: {},
      },
    ];

    useWidgetStore.setState({
      widgets,
      activeLayoutMode: 'desktop',
      layoutsByMode: {
        desktop: widgets.map(({ config: _config, ...layout }) => layout),
        mobile: [],
      },
      widgetConfigs: widgets.map(({ id, type, config }) => ({ id, type, config })),
    });

    expect(useWidgetStore.getState().updateWidget('left', { size: { w: 3, h: 1 } })).toBe(false);
    expect(
      useWidgetStore
        .getState()
        .batchUpdatePositions([{ id: 'right', position: { x: 0, y: 0 } }])
    ).toBe(false);
    expect(
      useWidgetStore.getState().addWidgetWithLayout(
        {
          id: 'new',
          type: 'today',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 0 },
          config: {},
        },
        []
      )
    ).toBe(false);
    expect(useWidgetStore.getState().widgets).toEqual(widgets);

    expect(
      useWidgetStore.getState().addWidgetWithLayout(
        {
          id: 'new',
          type: 'today',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 0 },
          config: {},
        },
        [{ id: 'left', position: { x: 0, y: 1 } }]
      )
    ).toBe(true);
    expect(
      useWidgetStore.getState().widgets.map(({ id, position }) => ({ id, position }))
    ).toEqual([
      { id: 'left', position: { x: 0, y: 1 } },
      { id: 'right', position: { x: 2, y: 0 } },
      { id: 'new', position: { x: 0, y: 0 } },
    ]);
  });

  it('removes a deleted bookmark reference without deleting the links widget', async () => {
    const { useWidgetStore } = await import('@/store/useWidgetStore');
    const layouts = {
      desktop: [
        {
          id: 'links',
          type: 'links' as const,
          size: { w: 2, h: 1 },
          position: { x: 0, y: 0 },
        },
      ],
      mobile: [],
    };
    const configs = [
      {
        id: 'links',
        type: 'links' as const,
        config: { bookmarkIds: ['docs'] },
      },
    ];
    const bookmarks = [
      { id: 'docs', title: 'Docs', url: 'https://example.com/docs' },
    ];

    expect(useWidgetStore.getState().replaceWidgetData(layouts, configs, bookmarks)).toBe(true);
    useWidgetStore.getState().removeBookmark('docs');

    expect(useWidgetStore.getState().bookmarks).toEqual([]);
    expect(useWidgetStore.getState().widgets).toHaveLength(1);
    expect(useWidgetStore.getState().widgets[0].config).toMatchObject({
      bookmarkIds: [],
    });
  });
});
