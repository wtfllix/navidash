'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { WidgetOfType } from '@/types';
import { useLocale } from 'next-intl';

const RANDOM_PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#f43f5e',
  '#1f2937',
];

const SOLAR_TERMS = [
  { month: 1, day: 5, zh: '小寒', en: 'Minor Cold' },
  { month: 1, day: 20, zh: '大寒', en: 'Major Cold' },
  { month: 2, day: 4, zh: '立春', en: 'Start of Spring' },
  { month: 2, day: 19, zh: '雨水', en: 'Rain Water' },
  { month: 3, day: 6, zh: '惊蛰', en: 'Awakening of Insects' },
  { month: 3, day: 21, zh: '春分', en: 'Spring Equinox' },
  { month: 4, day: 5, zh: '清明', en: 'Pure Brightness' },
  { month: 4, day: 20, zh: '谷雨', en: 'Grain Rain' },
  { month: 5, day: 5, zh: '立夏', en: 'Start of Summer' },
  { month: 5, day: 21, zh: '小满', en: 'Grain Full' },
  { month: 6, day: 6, zh: '芒种', en: 'Grain in Ear' },
  { month: 6, day: 21, zh: '夏至', en: 'Summer Solstice' },
  { month: 7, day: 7, zh: '小暑', en: 'Minor Heat' },
  { month: 7, day: 23, zh: '大暑', en: 'Major Heat' },
  { month: 8, day: 8, zh: '立秋', en: 'Start of Autumn' },
  { month: 8, day: 23, zh: '处暑', en: 'End of Heat' },
  { month: 9, day: 8, zh: '白露', en: 'White Dew' },
  { month: 9, day: 23, zh: '秋分', en: 'Autumn Equinox' },
  { month: 10, day: 8, zh: '寒露', en: 'Cold Dew' },
  { month: 10, day: 23, zh: '霜降', en: 'Frost Descent' },
  { month: 11, day: 7, zh: '立冬', en: 'Start of Winter' },
  { month: 11, day: 22, zh: '小雪', en: 'Minor Snow' },
  { month: 12, day: 7, zh: '大雪', en: 'Major Snow' },
  { month: 12, day: 22, zh: '冬至', en: 'Winter Solstice' },
] as const;

const FIXED_HOLIDAYS = [
  { month: 1, day: 1, zh: '元旦', en: 'New Year' },
  { month: 2, day: 14, zh: '情人节', en: 'Valentine\'s Day' },
  { month: 3, day: 8, zh: '妇女节', en: 'Women\'s Day' },
  { month: 5, day: 1, zh: '劳动节', en: 'Labor Day' },
  { month: 6, day: 1, zh: '儿童节', en: 'Children\'s Day' },
  { month: 10, day: 1, zh: '国庆节', en: 'National Day' },
  { month: 12, day: 24, zh: '平安夜', en: 'Christmas Eve' },
  { month: 12, day: 25, zh: '圣诞节', en: 'Christmas' },
] as const;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getHoliday(date: Date, isZh: boolean) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const match = FIXED_HOLIDAYS.find((item) => item.month === month && item.day === day);
  return match ? (isZh ? match.zh : match.en) : null;
}

function getSolarTerm(date: Date, isZh: boolean) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const match = SOLAR_TERMS.find((item) => item.month === month && item.day === day);
  return match ? (isZh ? match.zh : match.en) : null;
}

function getUpcomingSolarTerm(date: Date, isZh: boolean) {
  const today = startOfLocalDay(date).getTime();
  const year = date.getFullYear();

  const candidates = [year, year + 1]
    .flatMap((candidateYear) =>
      SOLAR_TERMS.map((item) => ({
        label: isZh ? item.zh : item.en,
        date: new Date(candidateYear, item.month - 1, item.day),
      }))
    )
    .filter((item) => startOfLocalDay(item.date).getTime() >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const next = candidates[0];
  if (!next) return null;

  const diffDays = Math.round(
    (startOfLocalDay(next.date).getTime() - today) / (1000 * 60 * 60 * 24)
  );

  return {
    label: next.label,
    diffDays,
  };
}

const DateWidget = React.memo(({ widget }: { widget: WidgetOfType<'date'> }) => {
  const [date, setDate] = useState(() => new Date());
  const locale = useLocale();
  const isZh = locale.startsWith('zh');

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const day = date.getDate();
  const paddedDay = day.toString().padStart(2, '0');
  const dayLabel = String(day);
  const month = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date).toUpperCase(),
    [date]
  );
  const monthLabel = isZh ? `${date.getMonth() + 1}月` : month;
  const weekdayShort = useMemo(
    () => date.toLocaleDateString(locale, { weekday: 'short' }),
    [date, locale]
  );
  const year = date.getFullYear();

  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const themeColor = useMemo(() => {
    if (widget.config?.color) {
      return widget.config.color;
    }

    return RANDOM_PALETTE[dayOfYear % RANDOM_PALETTE.length];
  }, [widget.config?.color, dayOfYear]);

  const { w, h } = widget.size || { w: 1, h: 1 };
  const isCompact = w === 1 && h === 1;
  const isWideDateCard = w >= 2 && h === 1;
  const holidayLabel = useMemo(() => getHoliday(date, isZh), [date, isZh]);
  const solarTermLabel = useMemo(() => getSolarTerm(date, isZh), [date, isZh]);
  const upcomingSolarTerm = useMemo(() => getUpcomingSolarTerm(date, isZh), [date, isZh]);
  const primaryNote = holidayLabel ?? solarTermLabel;
  const dateDisplay = `${year}.${String(date.getMonth() + 1).padStart(2, '0')}.${paddedDay}`;
  const upcomingText = upcomingSolarTerm
    ? isZh
      ? `${upcomingSolarTerm.label} · ${upcomingSolarTerm.diffDays === 0 ? '今天' : `${upcomingSolarTerm.diffDays} 天后`}`
      : `${upcomingSolarTerm.label} · ${upcomingSolarTerm.diffDays === 0 ? 'Today' : `In ${upcomingSolarTerm.diffDays}d`}`
    : null;
  const fallbackUpcomingTitle = isZh ? '下一节气' : 'Next';
  const fallbackUpcomingValue = upcomingText ?? (isZh ? '今天没有特别安排' : 'Nothing special today');
  const countdownTitle = upcomingSolarTerm?.label ?? fallbackUpcomingTitle;
  const countdownValue = upcomingSolarTerm
    ? isZh
      ? upcomingSolarTerm.diffDays === 0
        ? '今天'
        : `${upcomingSolarTerm.diffDays}天后`
      : upcomingSolarTerm.diffDays === 0
        ? 'Today'
        : `In ${upcomingSolarTerm.diffDays}d`
    : fallbackUpcomingValue;

  if (isWideDateCard) {
    return (
      <div className="relative flex h-full w-full overflow-hidden bg-[#fafaf8] text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]" />
        <div className="absolute inset-0 rounded-[inherit] ring-1 ring-black/[0.03]" />

        <div className="grid h-full w-full grid-cols-[1.58fr_0.92fr]">
          <div className="flex h-full flex-col border-r border-black/[0.03] px-5 py-4">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-px w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: `${themeColor}55` }}
                />
                <div
                  className="text-[0.6rem] font-medium uppercase tracking-[0.16em]"
                  style={{ color: `${themeColor}aa` }}
                >
                  {monthLabel}
                </div>
              </div>
              <div className="text-[0.6rem] font-medium tracking-[0.01em] text-[#55606a]">
                {weekdayShort}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="flex flex-col items-center">
                <div
                  className="text-[4.35rem] font-semibold text-[#2d3338]"
                  style={{
                    fontFamily: 'var(--font-slabo)',
                    lineHeight: 0.84,
                    letterSpacing: '-0.055em',
                    fontVariantNumeric: 'lining-nums tabular-nums',
                  }}
                >
                  {dayLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 h-full flex-col px-4 py-4">
            <div className="space-y-1">
              <div className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[#98a0a8]">
                {isZh ? '日期' : 'Date'}
              </div>
              <div className="text-[0.9rem] font-medium text-[#39424a]">
                {dateDisplay}
              </div>
            </div>

            <div className="mt-3.5 space-y-1">
              <div className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[#98a0a8]">
                {isZh ? '今日' : 'Today'}
              </div>
              <div className="line-clamp-1 text-[0.96rem] font-semibold text-[#2f3437]">
                {primaryNote ?? (isZh ? '无节日' : 'No Holiday')}
              </div>
            </div>

            <div className="mt-3.5 space-y-1">
              <div className="text-[0.58rem] font-medium tracking-[0.02em] text-[#98a0a8]">
                {countdownTitle}
              </div>
              <div className="line-clamp-1 text-[0.76rem] font-medium text-[#6d7680]">
                {countdownValue}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#fafaf8] text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]" />
        <div className="absolute inset-0 rounded-[inherit] ring-1 ring-black/[0.03]" />
        <div className="flex h-full flex-col px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="h-px w-4 shrink-0 rounded-full"
                style={{ backgroundColor: `${themeColor}55` }}
              />
              <div
                className="text-[0.64rem] font-medium uppercase tracking-[0.2em]"
                style={{ color: `${themeColor}aa` }}
              >
                {monthLabel}
              </div>
            </div>
            <div className="text-[0.64rem] font-medium tracking-[0.02em] text-[#55606a]">
              {weekdayShort}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="flex flex-col items-center">
              <div
                className="text-[4.05rem] font-semibold text-[#2d3338]"
                style={{
                  fontFamily: 'var(--font-slabo)',
                  lineHeight: 0.84,
                  letterSpacing: '-0.06em',
                  fontVariantNumeric: 'lining-nums tabular-nums',
                }}
              >
                {dayLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#fafaf8] text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.03)]">
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]" />
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-black/[0.03]" />
      <div className="grid h-full w-full grid-cols-[1.55fr_0.95fr]">
        <div className="flex h-full flex-col border-r border-black/[0.03] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="h-px w-4 shrink-0 rounded-full"
                style={{ backgroundColor: `${themeColor}55` }}
              />
              <div
                className="text-[0.64rem] font-medium uppercase tracking-[0.2em]"
                style={{ color: `${themeColor}aa` }}
              >
                {monthLabel}
              </div>
            </div>
            <div className="text-[0.64rem] font-medium tracking-[0.02em] text-[#55606a]">
              {weekdayShort}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="flex flex-col items-center">
              <div
                className="text-[5rem] font-semibold text-[#2d3338]"
                style={{
                  fontFamily: 'var(--font-slabo)',
                  lineHeight: 0.84,
                  letterSpacing: '-0.06em',
                  fontVariantNumeric: 'lining-nums tabular-nums',
                }}
              >
                {dayLabel}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 h-full flex-col px-4 py-4">
          <div className="space-y-1">
            <div className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[#98a0a8]">
              {isZh ? '日期' : 'Date'}
            </div>
            <div className="text-[0.92rem] font-medium text-[#39424a]">
              {dateDisplay}
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[#98a0a8]">
              {isZh ? '今日' : 'Today'}
            </div>
            <div className="line-clamp-1 text-[0.98rem] font-semibold text-[#2f3437]">
              {primaryNote ?? (isZh ? '无节日' : 'No Holiday')}
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[0.58rem] font-medium tracking-[0.02em] text-[#98a0a8]">
              {countdownTitle}
            </div>
            <div className="line-clamp-1 text-[0.76rem] font-medium text-[#6d7680]">
              {countdownValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DateWidget.displayName = 'DateWidget';

export default DateWidget;
