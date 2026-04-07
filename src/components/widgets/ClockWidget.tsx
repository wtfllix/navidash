'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { WidgetOfType } from '@/types';
import { useLocale } from 'next-intl';

function useClockDisplay(time: Date, locale: string, size: { w: number; h: number }) {
  const is11 = size.w === 1 && size.h === 1;
  const pad = (value: number) => value.toString().padStart(2, '0');

  const hourString = pad(time.getHours());
  const minuteString = pad(time.getMinutes());
  const secondString = pad(time.getSeconds());
  const weekday = time.toLocaleDateString(locale, { weekday: is11 ? 'short' : 'long' });
  const monthDay = time.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const compactDate = time.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
  const monthDayWeekday = `${monthDay} ${weekday}`;
  const fullTime = `${hourString}:${minuteString}`;
  const preciseTime = `${hourString}:${minuteString}:${secondString}`;

  return {
    is11,
    hourString,
    minuteString,
    secondString,
    weekday,
    monthDay,
    compactDate,
    fullTime,
    preciseTime,
  };
}

function GlassClock({
  time,
  locale,
  size,
}: {
  time: Date;
  locale: string;
  size: { w: number; h: number };
}) {
  const display = useClockDisplay(time, locale, size);
  const isCompact = display.is11;
  const timeClass = isCompact ? 'text-[2.45rem]' : 'text-[2.95rem]';
  const isDaytime = time.getHours() >= 6 && time.getHours() < 18;
  const AccentIcon = isDaytime ? Sun : Moon;
  const headerText = isCompact
    ? `${display.compactDate} ${display.weekday}`
    : `${display.monthDay} ${display.weekday}`;
  const iconToneClass = isDaytime
    ? 'bg-amber-50 text-amber-500 ring-amber-100'
    : 'bg-indigo-50 text-indigo-500 ring-indigo-100';
  const paddingClass = isCompact ? 'px-3 py-2.5' : 'px-4 py-3';
  const iconSizeClass = isCompact ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]';
  const iconGlyphSize = isCompact ? 9 : 11;
  const headerTextClass = isCompact
    ? 'text-[0.56rem] tracking-[0.02em]'
    : 'text-[0.64rem] tracking-[0.04em]';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.94)_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.88),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(var(--primary-color),0.05),transparent_36%)]" />
      <div className={`relative flex h-full flex-col font-sf ${paddingClass}`}>
        <div className="flex items-center justify-between gap-2 text-slate-500">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={`flex shrink-0 items-center justify-center rounded-full ring-1 ${iconToneClass} ${iconSizeClass}`}
            >
              <AccentIcon size={iconGlyphSize} strokeWidth={2.1} />
            </span>
            <span className={`truncate font-medium text-slate-500/90 ${headerTextClass}`}>
              {headerText}
            </span>
          </div>
        </div>
        <div
          className={`flex flex-1 ${
            isCompact ? 'items-start justify-center pt-3' : 'items-end justify-end pt-1.5'
          }`}
        >
          <div
            className={`break-keep leading-none tracking-[-0.06em] text-slate-900 [font-variant-numeric:tabular-nums] ${timeClass} font-semibold ${
              isCompact ? 'text-center' : 'text-right'
            }`}
          >
            {isCompact ? display.fullTime : display.preciseTime}
          </div>
        </div>
      </div>
    </div>
  );
}

const ClockWidget = React.memo(({ widget }: { widget: WidgetOfType<'clock'> }) => {
  const [time, setTime] = useState<Date | null>(null);
  const locale = useLocale();

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />;
  }

  return <GlassClock time={time} locale={locale} size={widget.size} />;
});

ClockWidget.displayName = 'ClockWidget';

export default ClockWidget;
