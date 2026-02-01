'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Widget } from '@/types';
import { useLocale } from 'next-intl';

// Define a palette of high-quality colors for the random mode
const RANDOM_PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#1f2937', // Gray
];

const DateWidget = React.memo(({ widget }: { widget: Widget }) => {
  const [date, setDate] = useState(new Date());
  const locale = useLocale();

  useEffect(() => {
    // Check for date change every minute
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== date.getDate()) {
        setDate(now);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [date]);

  const day = date.getDate();
  const month = useMemo(() => date.toLocaleDateString(locale, { month: 'short' }).toUpperCase(), [date, locale]);
  const weekday = useMemo(() => date.toLocaleDateString(locale, { weekday: 'long' }), [date, locale]);
  const year = date.getFullYear();

  // Determine theme color: Configured > Random by Day > Default
  const themeColor = useMemo(() => {
    if (widget.config?.color) {
      return widget.config.color;
    }
    // Generate a pseudo-random index based on the day of the year to ensure consistency across renders/refreshes for the same day
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Use the day of year to pick a color
    return RANDOM_PALETTE[dayOfYear % RANDOM_PALETTE.length];
  }, [widget.config?.color, date]);

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden group select-none shadow-sm rounded-xl">
       {/* Header Section: Colored background with Month - Reduced height to 20% */}
       <div 
         className="h-[20%] w-full flex items-center justify-center relative overflow-hidden"
         style={{ backgroundColor: themeColor }}
       >
         {/* Subtle overlay for texture */}
         <div className="absolute inset-0 bg-black/5"></div>
         
         <span className="text-white font-bold tracking-widest text-sm z-10 drop-shadow-sm uppercase">
           {month}
         </span>
       </div>

       {/* Body Section: White background with Date and Weekday */}
       <div className="flex-1 flex flex-col items-center justify-center bg-white relative">
         <span 
           className="text-6xl font-black leading-none tracking-tighter mb-1"
           style={{ color: '#1f2937' }} // Always dark text for contrast
         >
           {day}
         </span>
         
         <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
           {weekday}
         </span>

         {/* Year appears on hover in the corner */}
         <span className="absolute bottom-1.5 right-2 text-[10px] text-gray-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
           {year}
         </span>
       </div>
    </div>
  );
});

DateWidget.displayName = 'DateWidget';

export default DateWidget;
