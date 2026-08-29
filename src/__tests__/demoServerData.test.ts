describe('demo server data', () => {
  const originalDemoMode = process.env.DEMO_MODE;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env.DEMO_MODE = 'true';
    global.fetch = jest.fn(() => {
      throw new Error('Demo data must not access an upstream service');
    });
  });

  afterEach(() => {
    if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = originalDemoMode;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('serves built-in F1 standings without calling Jolpica', async () => {
    const { getF1DriverStandings } = await import('@/lib/server/f1Standings');

    const standings = await getF1DriverStandings();
    expect(standings).toMatchObject({
      season: 2026,
    });
    expect(standings.standings[0]).toMatchObject({ position: 1, code: 'ANT' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('serves the built-in Komari node without environment credentials', async () => {
    const { DEMO_KOMARI_NODE_ID } = await import('@/lib/demo');
    const { getKomariNodesResponse, getKomariStatuses } = await import('@/lib/server/komari');

    await expect(getKomariNodesResponse()).resolves.toEqual({
      state: 'ok',
      nodes: [{ id: DEMO_KOMARI_NODE_ID, name: 'Tokyo Edge' }],
    });
    await expect(getKomariStatuses([DEMO_KOMARI_NODE_ID])).resolves.toMatchObject({
      state: 'ok',
      nodes: {
        [DEMO_KOMARI_NODE_ID]: {
          name: 'Tokyo Edge',
          online: true,
        },
      },
      missingNodeIds: [],
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
