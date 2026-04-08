import { z } from 'zod';
import { getDemoWeather, isServerDemoMode } from '@/lib/demo';

export type WeatherAuthType = 'apikey' | 'jwt';

export interface WeatherRequestParams {
  lat: number;
  lon: number;
  locale: string;
  host?: string;
  authType?: WeatherAuthType;
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
  const apiKey =
    process.env.QWEATHER_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_QWEATHER_API_KEY?.trim() ||
    '';
  const host =
    process.env.QWEATHER_API_HOST?.trim() ||
    process.env.NEXT_PUBLIC_QWEATHER_API_HOST?.trim() ||
    '';
  const authType = normalizeWeatherAuthType(
    process.env.QWEATHER_AUTH_TYPE?.trim() || process.env.NEXT_PUBLIC_QWEATHER_AUTH_TYPE?.trim()
  );

  return {
    apiKey,
    host,
    authType,
  };
}

export async function fetchServerWeather({
  lat,
  lon,
  locale,
  host,
  authType,
}: WeatherRequestParams) {
  if (isServerDemoMode) {
    return getDemoWeather();
  }

  const serverConfig = getWeatherServerConfig();
  const apiKey = serverConfig.apiKey;

  if (!apiKey) {
    throw new Error('Missing QWeather API key');
  }

  const effectiveHost = host?.trim() || serverConfig.host || 'https://devapi.qweather.com';
  const effectiveAuthType = authType || serverConfig.authType;
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
