'use client';

import React, { useEffect, useState } from 'react';
import { WidgetOfType } from '@/types';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Loader2,
  Moon,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSettingsStore } from '@/store/useSettingsStore';

interface QWeatherNow {
  obsTime: string;
  temp: string;
  feelsLike: string;
  icon: string;
  text: string;
  windScale: string;
  humidity: string;
  cloud: string;
}

interface WeatherData {
  current: QWeatherNow;
}

const getWeatherIcon = (iconCode: string, size = 24, className = '') => {
  const code = parseInt(iconCode, 10);

  if (Number.isNaN(code)) {
    return <CloudSun className={`text-gray-500 ${className}`} size={size} />;
  }

  if (code === 100) return <Sun className={`text-yellow-400 ${className}`} size={size} />;
  if (code === 150) return <Moon className={`text-yellow-100 ${className}`} size={size} />;
  if (code >= 101 && code <= 149) {
    return <CloudSun className={`text-orange-200 ${className}`} size={size} />;
  }
  if (code >= 300 && code <= 304) {
    return <CloudRain className={`text-sky-200 ${className}`} size={size} />;
  }
  if (code >= 305 && code <= 399) {
    return <CloudDrizzle className={`text-sky-100 ${className}`} size={size} />;
  }
  if (code >= 400 && code <= 499) {
    return <CloudSnow className={`text-cyan-50 ${className}`} size={size} />;
  }
  if (code >= 500 && code <= 515) {
    return <CloudFog className={`text-slate-200 ${className}`} size={size} />;
  }

  return <Cloud className={`text-slate-100 ${className}`} size={size} />;
};

const WeatherBackground = ({ iconCode }: { iconCode: string }) => {
  const code = parseInt(iconCode, 10);
  const isRain = code >= 300 && code <= 399;
  const isSnow = code >= 400 && code <= 499;
  const isFog = code >= 500 && code <= 515;
  const isNight = code >= 150 && code <= 153;
  const isSunny = code === 100;
  const isCloudy = code >= 101 && code <= 149;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_34%,rgba(15,23,42,0.16)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_44%)]" />
      <div className="weather-ambient-drift absolute inset-x-10 top-0 h-12 rounded-b-[2rem] bg-white/6 blur-2xl" />
      {(isRain || isSnow || isFog) && (
        <div
          className={`absolute inset-0 ${
            isRain
              ? 'bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.035)_45%,transparent_100%)]'
              : isSnow
                ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_80%_35%,rgba(255,255,255,0.05),transparent_18%)]'
                : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_55%)]'
          }`}
        />
      )}
      {isCloudy && (
        <div className="weather-ambient-drift absolute right-[-6%] top-[10%] h-28 w-28 rounded-full bg-white/5 blur-3xl" />
      )}
      {isRain && (
        <>
          <div className="weather-ambient-rain absolute inset-0 bg-[repeating-linear-gradient(120deg,transparent_0_14px,rgba(255,255,255,0.05)_14px_16px,transparent_16px_34px)]" />
          <div className="weather-ambient-rain absolute inset-0 opacity-40 [animation-delay:-1.4s] bg-[repeating-linear-gradient(120deg,transparent_6px_18px,rgba(255,255,255,0.04)_18px_19px,transparent_19px_38px)]" />
        </>
      )}
      {isFog && (
        <div className="weather-ambient-drift absolute inset-y-8 left-[-10%] right-[-10%] rounded-[999px] bg-white/5 blur-2xl" />
      )}
      {isSnow && (
        <div className="weather-ambient-drift absolute inset-0 bg-[radial-gradient(circle_at_24%_30%,rgba(255,255,255,0.08),transparent_2.5%),radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.06),transparent_2.2%),radial-gradient(circle_at_58%_78%,rgba(255,255,255,0.05),transparent_2.4%)]" />
      )}
      {isSunny && (
        <>
          <div className="weather-ambient-glow absolute -right-8 top-0 h-24 w-24 rounded-full bg-white/8 blur-3xl" />
          <div className="weather-ambient-float absolute right-8 top-5 h-12 w-12 rounded-full border border-white/10 bg-white/5 blur-[1px]" />
        </>
      )}
      {isNight && (
        <>
          <div className="weather-ambient-drift absolute -right-8 top-0 h-28 w-28 rounded-full bg-white/5 blur-3xl" />
          <div className="weather-ambient-twinkle absolute left-[18%] top-[24%] h-1.5 w-1.5 rounded-full bg-white/12 blur-[1px]" />
          <div className="weather-ambient-twinkle absolute right-[22%] top-[34%] h-1 w-1 rounded-full bg-white/10 [animation-delay:-2.2s]" />
        </>
      )}
    </div>
  );
};

const getBackgroundGradient = (iconCode: string) => {
  const code = parseInt(iconCode, 10);

  if (code >= 300 && code <= 499) return 'from-slate-700 via-slate-700 to-slate-800';
  if (code === 150) return 'from-slate-800 via-slate-800 to-slate-900';
  if (code === 100) return 'from-slate-600 via-slate-700 to-slate-800';
  if (code === 104 || (code >= 500 && code <= 515)) return 'from-slate-600 via-slate-700 to-slate-800';
  if (code >= 101 && code <= 149) return 'from-slate-600 via-slate-700 to-slate-800';

  return 'from-slate-600 via-slate-700 to-slate-800';
};

function formatUpdatedTime(obsTime: string | undefined, locale: string) {
  if (!obsTime) return null;
  return new Date(obsTime).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WeatherWidget = React.memo(({ widget }: { widget: WidgetOfType<'weather'> }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const t = useTranslations('Widgets');
  const locale = useLocale();
  const {
    weatherApiKey,
    weatherCity,
    weatherLat,
    weatherLon,
    weatherSub: globalWeatherSub,
    weatherCustomHost: globalWeatherCustomHost,
    weatherAuthType: globalWeatherAuthType,
    hasFetchedSettings,
  } = useSettingsStore();

  const apiKey = weatherApiKey || widget.config?.apiKey;
  const lat = weatherLat ?? widget.config?.lat ?? 39.9042;
  const lon = weatherLon ?? widget.config?.lon ?? 116.4074;
  const city = weatherCity || widget.config?.city || 'Beijing';
  const weatherSub = globalWeatherSub || widget.config?.weatherSub || 'free';
  const weatherCustomHost = globalWeatherCustomHost || widget.config?.weatherCustomHost;
  const weatherAuthType = globalWeatherAuthType || widget.config?.weatherAuthType || 'param';

  useEffect(() => {
    const fetchWeather = async () => {
      if (!apiKey) {
        setLoading(false);
        return;
      }

      const cacheKey = `qweather_cache_${lat}_${lon}_${weatherSub}_${weatherCustomHost}_${weatherAuthType}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setWeatherData(data);
            return;
          }
        } catch (cacheError) {
          console.error('Cache parse error', cacheError);
        }
      }

      try {
        setLoading(true);
        const lang = locale === 'zh' ? 'zh' : 'en';
        const location = `${Math.round(lon * 100) / 100},${Math.round(lat * 100) / 100}`;

        let baseUrl;
        if (weatherCustomHost && weatherCustomHost.trim()) {
          let host = weatherCustomHost.trim();
          if (!/^https?:\/\//i.test(host)) {
            host = `https://${host}`;
          }
          baseUrl = host.replace(/\/+$/, '');
        } else {
          baseUrl = 'https://devapi.qweather.com';
        }

        const headers: HeadersInit = {};
        if (weatherAuthType === 'bearer') {
          headers.Authorization = `Bearer ${apiKey}`;
        }

        const queryParams = new URLSearchParams({
          location,
          lang,
        });

        if (weatherAuthType !== 'bearer') {
          queryParams.append('key', apiKey);
        }

        const nowUrl = `${baseUrl}/v7/weather/now?${queryParams.toString()}`;
        const nowRes = await fetch(nowUrl, { headers });

        if (!nowRes.ok) {
          throw new Error('Weather API Error');
        }

        const nowData = await nowRes.json();
        if (nowData.code !== '200') {
          throw new Error('API Code Error');
        }

        const combinedData: WeatherData = {
          current: nowData.now,
        };

        setWeatherData(combinedData);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: combinedData,
          })
        );
        setError(false);
      } catch (fetchError) {
        console.error('Failed to fetch weather', fetchError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, lat, lon, locale, weatherAuthType, weatherCustomHost, weatherSub]);

  const sizeKey = `${widget.size.w}x${widget.size.h}`;

  if (!hasFetchedSettings) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/70 backdrop-blur-sm">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-white px-4 text-center">
        <CloudSun size={32} className="mb-2 text-gray-300" />
        <span className="text-sm font-medium text-gray-500">{t('weather_setup_title')}</span>
        <span className="mt-1 text-xs text-gray-400">{t('weather_setup_hint')}</span>
      </div>
    );
  }

  if (loading && !weatherData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-white px-4 text-center text-red-400">
        <Cloud size={32} className="mb-2" />
        <span className="text-xs">{t('weather_error')}</span>
        <span className="mt-1 text-[11px] text-gray-400">{city}</span>
      </div>
    );
  }

  const current = weatherData.current;
  const updatedAt = formatUpdatedTime(current.obsTime, locale);
  const bgGradient = getBackgroundGradient(current.icon);
  const icon = getWeatherIcon(
    current.icon,
    sizeKey === '1x1' ? 30 : sizeKey === '2x1' ? 40 : 54,
    'text-white'
  );

  const commonShellClassName = `relative h-full w-full overflow-hidden bg-gradient-to-br ${bgGradient} text-white`;

  if (sizeKey === '1x1') {
    return (
      <div className={commonShellClassName}>
        <WeatherBackground iconCode={current.icon} />
        <div className="relative flex h-full flex-col justify-between p-3">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              {city}
            </div>
            <div className="mt-1 truncate text-xs font-medium text-white/90">{current.text}</div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="shrink-0 drop-shadow-md">{icon}</div>
            <div className="text-right">
              <div className="text-[34px] font-light leading-none tracking-[-0.06em]">
                {current.temp}°
              </div>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/72">
                <Droplets size={10} />
                <span>{current.humidity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sizeKey === '2x1') {
    return (
      <div className={commonShellClassName}>
        <WeatherBackground iconCode={current.icon} />
        <div className="relative flex h-full items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              {city}
            </div>
            <div className="mt-2 truncate text-[15px] font-medium text-white/95">{current.text}</div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-white/78">
              <div className="flex items-center gap-1">
                <Droplets size={11} />
                <span>{current.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind size={11} />
                <span>{current.windScale}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="drop-shadow-md">{icon}</div>
            <div className="text-right">
              <div className="text-[42px] font-light leading-none tracking-[-0.08em]">
                {current.temp}°
              </div>
              <div className="mt-1 text-[11px] text-white/72">
                {t('feels_like')} {current.feelsLike}°
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={commonShellClassName}>
      <WeatherBackground iconCode={current.icon} />
      <div className="relative flex h-full min-h-0 flex-col p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              {city}
            </div>
            <div className="mt-1.5 truncate text-base font-medium text-white/96">{current.text}</div>
          </div>
          {updatedAt && sizeKey !== '2x2' && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[10px] text-white/64 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white/45" />
              <span>{t('weather_updated_at', { time: updatedAt })}</span>
            </div>
          )}
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div className="scale-[0.82] origin-left drop-shadow-lg">{icon}</div>
          <div className="text-right">
            <div className="text-[46px] font-light leading-none tracking-[-0.08em]">
              {current.temp}°
            </div>
            <div className="mt-0.5 text-xs text-white/76">
              {t('feels_like')} {current.feelsLike}°
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 pt-2">
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-2">
            <div className="space-y-0.5 border-r border-white/10 pr-2">
              <div className="flex items-center gap-2 text-white/72">
                <Droplets size={11} />
                <span className="text-[10px]">{t('humidity')}</span>
              </div>
              <div className="text-[1.45rem] font-medium leading-none">{current.humidity}%</div>
            </div>

            <div className="space-y-0.5 pl-0.5">
              <div className="flex items-center gap-2 text-white/72">
                <Wind size={11} />
                <span className="text-[10px]">{t('wind_speed')}</span>
              </div>
              <div className="text-[1.45rem] font-medium leading-none">{current.windScale}</div>
            </div>

            <div className="space-y-0.5 border-r border-white/10 pr-2 pt-0.5">
              <div className="flex items-center gap-2 text-white/72">
                <Thermometer size={11} />
                <span className="text-[10px]">{t('feels_like')}</span>
              </div>
              <div className="text-[1.45rem] font-medium leading-none">{current.feelsLike}°</div>
            </div>

            <div className="space-y-0.5 pl-0.5 pt-0.5">
              <div className="flex items-center gap-2 text-white/72">
                <Cloud size={11} />
                <span className="text-[10px]">{t('weather_cloud_cover')}</span>
              </div>
              <div className="text-[1.45rem] font-medium leading-none">{current.cloud || '0'}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
