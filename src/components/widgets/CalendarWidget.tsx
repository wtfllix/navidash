'use client';

import React from 'react';
import { WidgetOfType } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  widget: WidgetOfType<'calendar'>;
}

const LUNAR_DAY_LABELS = [
  '',
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
] as const;

export default function CalendarWidget({ widget }: CalendarWidgetProps) {
  const t = useTranslations('Widgets');
  const locale = useLocale();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const today = React.useMemo(() => new Date(), []);
  const isWeeklyView = widget.size.w === 2 && widget.size.h === 1;
  const showLunar = widget.size.w === 2 && widget.size.h === 2;

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const weekDays = [
    t('weekday_sun'), t('weekday_mon'), t('weekday_tue'), t('weekday_wed'), 
    t('weekday_thu'), t('weekday_fri'), t('weekday_sat')
  ];

  const startOfWeek = React.useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    date.setDate(date.getDate() - date.getDay());
    return date;
  }, [currentDate]);

  const weekDates = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return date;
      }),
    [startOfWeek]
  );

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevWeek = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
  };

  const nextWeek = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: widget.size.w === 1 ? 'short' : 'long',
    year: 'numeric',
  }).format(currentDate);
  const todayLabel = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(today);
  const lunarFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        month: 'short',
        day: 'numeric',
      }),
    []
  );
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();
  const formatLunarLabel = React.useCallback(
    (date: Date) => {
      const parts = lunarFormatter.formatToParts(date);
      const month = parts.find((part) => part.type === 'month')?.value ?? '';
      const dayValue = Number(parts.find((part) => part.type === 'day')?.value ?? '');
      if (!Number.isFinite(dayValue) || dayValue <= 0 || dayValue >= LUNAR_DAY_LABELS.length) {
        return month;
      }

      return dayValue === 1 ? month : LUNAR_DAY_LABELS[dayValue];
    },
    [lunarFormatter]
  );

  if (isWeeklyView) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-white p-4 font-sans">
        <div className="mb-2 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-sans text-sm font-bold text-gray-800">{monthLabel}</h3>
            <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.2em] text-gray-400">
              {t('calendar')}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={goToCurrentWeek}
              className="rounded-md px-2 py-1 font-sans text-[10px] font-semibold uppercase tracking-wide text-blue-600 transition-colors hover:bg-blue-50"
            >
              {t('today')}
            </button>
            <button
              type="button"
              onClick={prevWeek}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={nextWeek}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-7 gap-1">
          {weekDates.map((date) => {
            const sameAsToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isCurrentRefMonth = date.getMonth() === currentDate.getMonth();

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setCurrentDate(date)}
                className="flex min-w-0 flex-col items-center justify-center rounded-lg py-1 text-center font-sans transition-colors hover:bg-gray-50"
              >
                <span
                  className={`font-sans text-[10px] font-medium uppercase tracking-[0.16em] ${
                    sameAsToday ? 'text-blue-500' : isWeekend ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {weekDays[date.getDay()]}
                </span>
                <span
                  className={`
                    mt-1 flex h-8 w-8 items-center justify-center rounded-full font-sans text-sm leading-none
                    [font-variant-numeric:tabular-nums] transition-colors
                    ${
                      sameAsToday
                        ? 'bg-blue-500 font-semibold text-white shadow-sm'
                        : isCurrentRefMonth
                        ? isWeekend
                          ? 'text-gray-400'
                          : 'text-gray-700'
                        : 'text-gray-300'
                    }
                  `}
                >
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400">
          <span className="font-sans">
            {weekDates[0].getDate()} - {weekDates[6].getDate()}
          </span>
          <span className="font-sans">{isCurrentMonth ? t('calendar_current_month') : t('calendar_other_month')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white p-4 font-sans">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-gray-800">
            {monthLabel}
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-400">
            {t('calendar')}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={goToToday}
            className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600 transition-colors hover:bg-blue-50"
          >
            {t('today')}
          </button>
          <button 
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((day) => (
          <div key={day} className="font-sans text-[10px] font-medium uppercase text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const today = isToday(day);
          const weekdayIndex = (firstDayOfMonth + i) % 7;
          const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;
          const solarDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const lunarLabel = showLunar ? formatLunarLabel(solarDate) : null;
          return (
            <div
              key={day}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl font-sans transition-colors
                ${today
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <span
                className={`text-xs leading-none [font-variant-numeric:tabular-nums] ${
                  today ? 'font-semibold text-white' : isWeekend ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {day}
              </span>
              {lunarLabel ? (
                <span className={`mt-1 px-0.5 text-[9px] leading-none ${today ? 'text-white/80' : 'text-gray-300'}`}>
                  {lunarLabel}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400">
        <span>{t('today')}: {todayLabel}</span>
        <span>{isCurrentMonth ? t('calendar_current_month') : t('calendar_other_month')}</span>
      </div>
    </div>
  );
}
