describe('weather server config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('prefers server-side weather env vars', async () => {
    process.env.QWEATHER_API_KEY = 'server-key';
    process.env.QWEATHER_API_HOST = 'server-host';
    process.env.QWEATHER_AUTH_TYPE = 'jwt';
    process.env.NEXT_PUBLIC_QWEATHER_API_KEY = 'public-key';

    const { getWeatherServerConfig } = await import('@/lib/server/weather');

    expect(getWeatherServerConfig()).toEqual({
      apiKey: 'server-key',
      host: 'server-host',
      authType: 'jwt',
    });
  });

  it('falls back to legacy public weather env vars', async () => {
    process.env.NEXT_PUBLIC_QWEATHER_API_KEY = 'public-key';
    process.env.NEXT_PUBLIC_QWEATHER_API_HOST = 'public-host';
    process.env.NEXT_PUBLIC_QWEATHER_AUTH_TYPE = 'bearer';

    const { getWeatherServerConfig } = await import('@/lib/server/weather');

    expect(getWeatherServerConfig()).toEqual({
      apiKey: 'public-key',
      host: 'public-host',
      authType: 'jwt',
    });
  });
});
