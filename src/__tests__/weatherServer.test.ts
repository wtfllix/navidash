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

  it('ignores legacy public weather env vars', async () => {
    delete process.env.QWEATHER_API_KEY;
    delete process.env.QWEATHER_API_HOST;
    delete process.env.QWEATHER_AUTH_TYPE;
    process.env.NEXT_PUBLIC_QWEATHER_API_KEY = 'public-key';
    process.env.NEXT_PUBLIC_QWEATHER_API_HOST = 'public-host';
    process.env.NEXT_PUBLIC_QWEATHER_AUTH_TYPE = 'bearer';

    const { getWeatherServerConfig } = await import('@/lib/server/weather');

    expect(getWeatherServerConfig()).toEqual({
      apiKey: '',
      host: '',
      authType: 'apikey',
    });
  });

  it('exposes only sanitized non-secret weather status', async () => {
    process.env.QWEATHER_API_KEY = 'must-not-leak';
    process.env.QWEATHER_API_HOST =
      'https://username:password@weather.example.com/custom?token=secret';
    process.env.QWEATHER_AUTH_TYPE = 'apikey';

    const { getWeatherPublicConfig } = await import('@/lib/server/weather');
    const status = getWeatherPublicConfig();

    expect(status).toEqual({
      provider: 'QWeather',
      configured: true,
      host: 'https://weather.example.com',
      authType: 'apikey',
      demo: false,
    });
    expect(status).not.toHaveProperty('apiKey');
    expect(JSON.stringify(status)).not.toContain('must-not-leak');
    expect(JSON.stringify(status)).not.toContain('password');
  });
});
