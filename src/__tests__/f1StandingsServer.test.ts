describe('F1 standings server client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function upstreamResponse(points = '242') {
    return {
      MRData: {
        StandingsTable: {
          season: '2026',
          round: '12',
          StandingsLists: [
            {
              DriverStandings: [
                {
                  position: '1',
                  points,
                  wins: '6',
                  Driver: {
                    code: 'ANT',
                    givenName: 'Andrea Kimi',
                    familyName: 'Antonelli',
                  },
                  Constructors: [{ name: 'Mercedes' }],
                },
              ],
            },
          ],
        },
      },
    };
  }

  function mockResponse(body: unknown) {
    const text = JSON.stringify(body);
    return {
      ok: true,
      headers: { get: () => String(text.length) },
      text: async () => text,
    } as Response;
  }

  it('normalizes Jolpica standings and reuses the daily cache', async () => {
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue(mockResponse(upstreamResponse()));
    const { getF1DriverStandings } = await import('@/lib/server/f1Standings');

    await expect(getF1DriverStandings(1_000)).resolves.toMatchObject({
      season: 2026,
      round: 12,
      stale: false,
      standings: [
        {
          position: 1,
          code: 'ANT',
          familyName: 'Antonelli',
          constructor: 'Mercedes',
          points: 242,
          wins: 6,
        },
      ],
    });
    await getF1DriverStandings(2_000);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns stale cached standings when the daily refresh fails', async () => {
    jest.resetModules();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(mockResponse(upstreamResponse()))
      .mockRejectedValueOnce(new Error('upstream unavailable'));
    const { getF1DriverStandings } = await import('@/lib/server/f1Standings');

    await getF1DriverStandings(1_000);
    await expect(getF1DriverStandings(86_401_001)).resolves.toMatchObject({
      stale: true,
      standings: [{ code: 'ANT', points: 242 }],
    });
  });

  it('rejects malformed upstream standings without a cache', async () => {
    jest.resetModules();
    global.fetch = jest.fn().mockResolvedValue(mockResponse(upstreamResponse('not-a-number')));
    const { getF1DriverStandings } = await import('@/lib/server/f1Standings');

    await expect(getF1DriverStandings()).rejects.toBeDefined();
  });
});
