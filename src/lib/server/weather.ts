import { z } from 'zod';
import { getDemoWeather, isServerDemoMode } from '@/lib/demo';

export type WeatherAuthType = 'apikey' | 'jwt';
export const DEFAULT_QWEATHER_HOST = 'https://devapi.qweather.com';

export interface WeatherRequestParams {
  lat: number;
  lon: number;
  locale: string;
}

const qWeatherNowSchema = z.object({
  obsTime: z.string(),
  temp: z.string(),
  feelsLike: z.string(),
  icon: z.string(),
  text: z.string(),
  windScale: z.string(),
  humidity: z.string(),
  cloud: z.string(),
});

const qWeatherResponseSchema = z.object({
  code: z.string(),
  now: qWeatherNowSchema.optional(),
});

function normalizeWeatherAuthType(value: string | undefined): WeatherAuthType {
  if (value === 'jwt' || value === 'bearer') {
    return 'jwt';
  }

  return 'apikey';
}

export function getWeatherServerConfig() {
  const apiKey = process.env.QWEATHER_API_KEY?.trim() || '';
  const host = process.env.QWEATHER_API_HOST?.trim() || '';
  const authType = normalizeWeatherAuthType(process.env.QWEATHER_AUTH_TYPE?.trim());

  return {
    apiKey,
    host,
    authType,
  };
}

export function getWeatherPublicConfig() {
  const { apiKey, host, authType } = getWeatherServerConfig();
  const configuredHost = host || DEFAULT_QWEATHER_HOST;
  let publicHost = DEFAULT_QWEATHER_HOST;

  try {
    const url = new URL(
      /^https?:\/\//i.test(configuredHost) ? configuredHost : `https://${configuredHost}`
    );
    publicHost = url.origin;
  } catch {
    // Keep the documented default when a configured host cannot be safely represented.
  }

  return {
    provider: 'QWeather' as const,
    configured: isServerDemoMode || Boolean(apiKey),
    host: publicHost,
    authType,
    demo: isServerDemoMode,
  };
}

export async function fetchServerWeather({
  lat,
  lon,
  locale,
}: WeatherRequestParams) {
  if (isServerDemoMode) {
    return getDemoWeather();
  }

  const serverConfig = getWeatherServerConfig();
  const apiKey = serverConfig.apiKey;

  if (!apiKey) {
    throw new Error('Missing QWeather API key');
  }

  const effectiveHost = serverConfig.host || DEFAULT_QWEATHER_HOST;
  const effectiveAuthType = serverConfig.authType;
  const lang = locale === 'zh' ? 'zh' : 'en';
  const location = `${Math.round(lon * 100) / 100},${Math.round(lat * 100) / 100}`;

  let baseUrl = effectiveHost;
  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/+$/, '');

  const headers: HeadersInit = {};
  if (effectiveAuthType === 'jwt') {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    headers['X-QW-Api-Key'] = apiKey;
  }

  const queryParams = new URLSearchParams({
    location,
    lang,
  });

  const response = await fetch(`${baseUrl}/v7/weather/now?${queryParams.toString()}`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Weather API HTTP ${response.status}`);
  }

  const parsed = qWeatherResponseSchema.parse(await response.json());
  if (parsed.code !== '200' || !parsed.now) {
    throw new Error(`Weather API code ${parsed.code}`);
  }

  return {
    current: parsed.now,
  };
}
