describe('Komari server RPC client', () => {
  const originalBaseUrl = process.env.KOMARI_BASE_URL;
  const originalApiKey = process.env.KOMARI_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    process.env.KOMARI_BASE_URL = 'https://komari.example.test';
    delete process.env.KOMARI_API_KEY;
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.KOMARI_BASE_URL;
    else process.env.KOMARI_BASE_URL = originalBaseUrl;
    if (originalApiKey === undefined) delete process.env.KOMARI_API_KEY;
    else process.env.KOMARI_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  function rpcResponse(request: { id: string; method: string }) {
    if (request.method === 'public:getNodesInformation') {
      return [
        {
          uuid: '30529324-e285-4cbd-ae6a-7011f7bdcfa6',
          name: 'Test node',
          region: 'us',
          traffic_limit: 0,
        },
      ];
    }
    return {
      '30529324-e285-4cbd-ae6a-7011f7bdcfa6': {
        client: '30529324-e285-4cbd-ae6a-7011f7bdcfa6',
        time: '2026-08-26T12:58:13.724768144Z',
        cpu: 3.5,
        ram: 128,
        ram_total: 1024,
        disk: 400,
        disk_total: 1000,
        net_in: 200,
        net_out: 100,
        net_total_up: 4000,
        net_total_down: 8000,
        online: true,
        uptime: 86_400,
      },
    };
  }

  it('normalizes public node metadata and latest status through RPC2', async () => {
    global.fetch = jest.fn(async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      return {
        ok: true,
        headers: { get: () => null },
        arrayBuffer: async () => {
          const bytes = Buffer.from(
            JSON.stringify({ jsonrpc: '2.0', id: request.id, result: rpcResponse(request) })
          );
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        },
      } as Response;
    }) as jest.Mock;

    const { getKomariStatus } = await import('@/lib/server/komari');
    await expect(getKomariStatus('30529324-e285-4cbd-ae6a-7011f7bdcfa6')).resolves.toMatchObject({
      state: 'ok',
      node: {
        name: 'Test node',
        regionFlag: '🇺🇸',
        online: true,
        cpuPercent: 3.5,
        memory: { usedBytes: 128, totalBytes: 1024, percent: 12.5 },
        disk: { usedBytes: 400, totalBytes: 1000, percent: 40 },
        network: { rxBytesPerSecond: 200, txBytesPerSecond: 100, trafficLimitBytes: 0 },
      },
    });
  });

  it('batches the active node IDs into one latest-status RPC request', async () => {
    global.fetch = jest.fn(async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      return {
        ok: true,
        headers: { get: () => null },
        arrayBuffer: async () => {
          const bytes = Buffer.from(
            JSON.stringify({ jsonrpc: '2.0', id: request.id, result: rpcResponse(request) })
          );
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        },
      } as Response;
    }) as jest.Mock;

    const { getKomariStatuses } = await import('@/lib/server/komari');
    await expect(
      getKomariStatuses(['30529324-e285-4cbd-ae6a-7011f7bdcfa6', '30529324-e285-4cbd-ae6a-7011f7bdcfa6'])
    ).resolves.toMatchObject({
      state: 'ok',
      nodes: { '30529324-e285-4cbd-ae6a-7011f7bdcfa6': { name: 'Test node' } },
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const latestStatusRequest = JSON.parse(String((global.fetch as jest.Mock).mock.calls[1][1].body));
    expect(latestStatusRequest).toMatchObject({
      method: 'common:getNodesLatestStatus',
      params: { uuids: ['30529324-e285-4cbd-ae6a-7011f7bdcfa6'] },
    });
  });

  it('does not expose an upstream RPC failure', async () => {
    global.fetch = jest.fn(async (_url, init) => {
      const request = JSON.parse(String(init?.body));
      return {
        ok: true,
        headers: { get: () => null },
        arrayBuffer: async () => {
          const bytes = Buffer.from(
            JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              error: { code: 401, message: 'Unauthorized' },
            })
          );
          return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        },
      } as Response;
    }) as jest.Mock;

    const { getKomariStatus } = await import('@/lib/server/komari');
    await expect(getKomariStatus('30529324-e285-4cbd-ae6a-7011f7bdcfa6')).resolves.toEqual({
      state: 'unavailable',
      nodes: [],
    });
  });
});
