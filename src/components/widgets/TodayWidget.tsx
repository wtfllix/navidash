'use client';

import React from 'react';
import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Loader2,
  Moon,
  Sun,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { WidgetOfType } from '@/types';

interface TodayWeather {
  current: {
    temp: string;
    icon: string;
    text: string;
  };
}

const TODAY_ACCENTS = [
  { color: '#3b82f6', rgb: '59, 130, 246' },
  { color: '#0ea5e9', rgb: '14, 165, 233' },
  { color: '#0891b2', rgb: '8, 145, 178' },
  { color: '#0d9488', rgb: '13, 148, 136' },
  { color: '#16a34a', rgb: '22, 163, 74' },
  { color: '#6366f1', rgb: '99, 102, 241' },
  { color: '#8b5cf6', rgb: '139, 92, 246' },
  { color: '#a855f7', rgb: '168, 85, 247' },
] as const;

export function getTodayAccent(date: Date) {
  const localDay = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
  return TODAY_ACCENTS[localDay % TODAY_ACCENTS.length];
}

function WeatherIcon({ code, accentColor }: { code: string; accentColor?: string }) {
  const value = Number(code);
  const accentProps = accentColor ? { style: { color: accentColor } } : {};

  if (value === 100) {
    return <Sun size={28} className={accentColor ? '' : 'text-amber-400'} {...accentProps} />;
  }
  if (value >= 150 && value <= 153) {
    return <Moon size={28} className={accentColor ? '' : 'text-indigo-400'} {...accentProps} />;
  }
  if (value >= 300 && value <= 399) {
    return <CloudRain size={28} className={accentColor ? '' : 'text-sky-500'} {...accentProps} />;
  }
  if (value >= 400 && value <= 499) {
    return <CloudSnow size={28} className={accentColor ? '' : 'text-cyan-500'} {...accentProps} />;
  }
  if (value >= 500 && value <= 515) {
    return <CloudFog size={28} className={accentColor ? '' : 'text-slate-400'} {...accentProps} />;
  }
  if (value >= 101 && value <= 149) {
    return <CloudSun size={28} className={accentColor ? '' : 'text-slate-500'} {...accentProps} />;
  }
  return <Cloud size={28} className={accentColor ? '' : 'text-slate-400'} {...accentProps} />;
}

interface TodayWidgetProps {
  widget: WidgetOfType<'today'>;
  previewDate?: Date;
}

export default function TodayWidget({ widget, previewDate }: TodayWidgetProps) {
  const locale = useLocale();
  const t = useTranslations('Widgets');
  const [now, setNow] = React.useState<Date | null>(null);
  const [weather, setWeather] = React.useState<TodayWeather | null>(null);
  const [weatherState, setWeatherState] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const isCompact = widget.size.w === 1;
  const isPlaque = widget.size.w >= 2 && widget.size.h >= 2;
  const { city, lat, lon } = widget.config;
  const hasLocation = Boolean(city && Number.isFinite(lat) && Number.isFinite(lon));

  React.useEffect(() => {
    if (previewDate) {
      setNow(previewDate);
      return;
    }

    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, [previewDate]);

  React.useEffect(() => {
    if (isCompact || !hasLocation) {
      setWeather(null);
      setWeatherState('idle');
      return;
    }

    let active = true;

    const fetchWeather = async () => {
      setWeatherState('loading');
      const query = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        locale,
      });

      try {
        const response = await fetch(`/api/weather?${query.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Weather request failed');
        const data = (await response.json()) as TodayWeather;
        if (!active) return;
        setWeather(data);
        setWeatherState('idle');
      } catch {
        if (!active) return;
        setWeather(null);
        setWeatherState('error');
      }
    };

    void fetchWeather();
    const timer = window.setInterval(fetchWeather, 30 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [hasLocation, isCompact, lat, locale, lon]);

  const timeParts = now
    ? new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now)
    : [];
  const hourLabel = timeParts.find((part) => part.type === 'hour')?.value ?? '--';
  const minuteLabel = timeParts.find((part) => part.type === 'minute')?.value ?? '--';
  const timeLabel = `${hourLabel}:${minuteLabel}`;
  const dateLabel = now
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }).format(now)
    : '';
  const monthLabel = now
    ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now)
    : '---';
  const dayLabel = now ? new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(now) : '--';
  const weekdayLabel = now
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now)
    : '';
  const accent = now ? getTodayAccent(now) : TODAY_ACCENTS[0];
  const accentStyle = {
    '--today-accent': accent.color,
    '--today-accent-rgb': accent.rgb,
  } as React.CSSProperties;

  if (isPlaque) {
    return (
      <div
        className="relative h-full w-full overflow-hidden bg-[#f7f6f2] text-[#294451]"
        style={accentStyle}
        data-testid="today-panel"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(247,246,242,0.9))]" />
        <div className="relative grid h-full grid-rows-[auto_minmax(0,1fr)_1px_74px] px-5 pb-4 pt-4">
          <div className="w-fit">
            <div className="text-[11px] font-semibold uppercase leading-none tracking-[0.24em] text-[var(--today-accent)]">
              {t('today')}
            </div>
            <div className="mt-2 h-1 w-9 bg-[var(--today-accent)]" />
          </div>

          <div className="flex min-h-0 items-center justify-center pt-1">
            <div
              className="flex items-baseline font-outfit text-[4.65rem] font-light leading-none tracking-[-0.07em] [font-variant-numeric:tabular-nums]"
              aria-label={timeLabel}
            >
              <span>{hourLabel}</span>
              <span className="mx-[0.07em] tracking-normal">:</span>
              <span
                className="text-[var(--today-accent)]"
                data-testid="today-clock-minute"
              >
                {minuteLabel}
              </span>
            </div>
          </div>

          <div className="bg-slate-400/45" />

          <div className="grid min-h-0 grid-cols-[1.12fr_1fr] pt-2.5">
            <div className="flex min-w-0 flex-col justify-center overflow-hidden pr-3">
              <div className="whitespace-nowrap font-handwriting text-[1.75rem] font-normal leading-[1.15] tracking-[-0.04em] text-[var(--today-accent)]">
                {monthLabel} {dayLabel}
              </div>
              <div className="mt-1.5 truncate pl-0.5 font-outfit text-[9px] font-normal uppercase tracking-[0.26em] text-[#58707b]">
                {weekdayLabel}
              </div>
            </div>

            <div className="flex min-w-0 items-center border-l border-slate-400/45 pl-3.5">
              {!hasLocation ? (
                <div className="flex min-w-0 items-center gap-2.5 text-[#294451]">
                  <CloudSun size={28} className="shrink-0 text-[var(--today-accent)]" />
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {t('weather_setup_title')}
                    </div>
                    <div className="mt-1 truncate text-[9px] text-slate-500">
                      {t('today_weather_setup')}
                    </div>
                  </div>
                </div>
              ) : weatherState === 'loading' && !weather ? (
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  {t('weather_loading')}
                </div>
              ) : weather ? (
                <div className="flex min-w-0 items-center gap-2.5">
                  <WeatherIcon code={weather.current.icon} accentColor={accent.color} />
                  <div className="min-w-0">
                    <div className="truncate text-[9px] font-semibold uppercase tracking-[0.08em]">
                      {city}
                    </div>
                    <div className="font-outfit text-[1.75rem] font-normal leading-none tracking-[-0.05em] text-[#294451]">
                      {weather.current.temp}°
                    </div>
                    <div className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[#294451]">
                      {weather.current.text}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2.5 text-[#294451]">
                  <CloudSun size={28} className="shrink-0 text-[var(--today-accent)]" />
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {city}
                    </div>
                    <div className="mt-1 truncate text-[9px] text-slate-500">
                      {t('today_weather_unavailable')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,#f1f5f9_100%)]"
      style={accentStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--today-accent-rgb),0.08),transparent_42%)]" />
      <div className={`relative grid h-full ${isCompact ? 'grid-cols-1' : 'grid-cols-[1.15fr_0.85fr]'}`}>
        <div className="flex min-w-0 flex-col justify-between px-4 py-3">
          <div className="text-ui-eyebrow text-slate-400">{t('today')}</div>
          <div>
            <div className="font-outfit text-[2.65rem] font-normal leading-none tracking-[-0.065em] text-slate-800 [font-variant-numeric:tabular-nums]">
              {timeLabel}
            </div>
            <div className="mt-1.5 truncate text-xs font-medium text-slate-500">{dateLabel}</div>
          </div>
        </div>

        {!isCompact && (
          <div className="my-3 flex min-w-0 items-center border-l border-slate-200/70 px-4">
            {!hasLocation ? (
              <div className="flex min-w-0 items-center gap-3 text-slate-400">
                <CloudSun size={26} />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-600">{t('weather_setup_title')}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-400">
                    {t('weather_setup_hint')}
                  </div>
                </div>
              </div>
            ) : weatherState === 'loading' && !weather ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                {t('weather_loading')}
              </div>
            ) : weather ? (
              <div className="flex min-w-0 items-center gap-3">
                <WeatherIcon code={weather.current.icon} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-medium tracking-[-0.04em] text-slate-700">
                      {weather.current.temp}°
                    </span>
                    <span className="truncate text-xs text-slate-500">{weather.current.text}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    {city}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-3 text-slate-400">
                <CloudSun size={26} />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-600">{city}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-400">
                    {weatherState === 'error' ? t('weather_error') : t('weather_loading')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
