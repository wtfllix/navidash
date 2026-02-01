import React from 'react';
import { Widget } from '@/types';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  widget: Widget;
}

export default function CalendarWidget({ widget }: CalendarWidgetProps) {
  const t = useTranslations('Widgets');
  const [currentDate, setCurrentDate] = React.useState(new Date());

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

  const monthNames = [
    t('month_jan'), t('month_feb'), t('month_mar'), t('month_apr'), t('month_may'), t('month_jun'),
    t('month_jul'), t('month_aug'), t('month_sep'), t('month_oct'), t('month_nov'), t('month_dec')
  ];

  const weekDays = [
    t('weekday_sun'), t('weekday_mon'), t('weekday_tue'), t('weekday_wed'), 
    t('weekday_thu'), t('weekday_fri'), t('weekday_sat')
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex space-x-1">
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
          <div key={day} className="text-[10px] text-gray-400 font-medium uppercase">
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
          return (
            <div
              key={day}
              className={`
                aspect-square flex items-center justify-center text-xs rounded-full
                ${today 
                  ? 'bg-blue-500 text-white font-bold shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
