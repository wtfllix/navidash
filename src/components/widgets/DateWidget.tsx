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
  const monthLong = useMemo(() => date.toLocaleDateString(locale, { month: 'long' }), [date, locale]);
  const weekday = useMemo(() => date.toLocaleDateString(locale, { weekday: 'long' }), [date, locale]);
  const weekdayShort = useMemo(() => date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase(), [date, locale]);
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

  // Size helpers
  const { w, h } = widget.size || { w: 1, h: 1 };
  const isSmall = w === 1 && h === 1;
  const isWide = w >= 2;
  const isLarge = w >= 2 && h >= 2;

  // Style Variants
  const renderClassic = () => (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden group select-none shadow-sm rounded-xl font-serif">
       {/* Header Section */}
       <div 
         className={`${isSmall ? 'h-[25%]' : 'h-[20%]'} w-full flex items-center justify-center relative overflow-hidden`}
         style={{ backgroundColor: themeColor }}
       >
         <div className="absolute inset-0 bg-black/5"></div>
         <span className={`text-white font-bold tracking-widest ${isSmall ? 'text-xs' : 'text-sm'} z-10 drop-shadow-sm uppercase`}>
           {month}
         </span>
       </div>

       {/* Body Section */}
       <div className="flex-1 flex flex-col items-center justify-center bg-white relative">
         <span 
           className={`${isSmall ? 'text-6xl' : 'text-8xl'} font-black leading-none tracking-tighter mb-1`}
           style={{ color: '#1f2937' }}
         >
           {day}
         </span>
         
         <span className={`${isSmall ? 'text-xs' : 'text-sm'} font-semibold text-gray-400 uppercase tracking-wide`}>
           {weekday}
         </span>

         <span className="absolute bottom-1.5 right-2 text-[10px] text-gray-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity font-sans">
           {year}
         </span>
       </div>
    </div>
  );

  const renderMinimal = () => (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden select-none shadow-sm rounded-xl p-3 font-outfit">
       <div className="flex-1 flex flex-row items-center justify-between">
          <span 
            className={`${isSmall ? 'text-6xl' : 'text-8xl'} font-bold leading-none tracking-tighter`}
            style={{ color: '#1f2937' }}
          >
            {day}
          </span>
          <div className="flex flex-col items-end justify-center space-y-1 h-full pt-1">
            <span 
              className={`${isSmall ? 'text-xs' : 'text-sm'} font-bold text-gray-900 uppercase tracking-wider`} 
              style={{ writingMode: 'vertical-rl' }}
            >
              {monthLong}
            </span>
             <span 
               className={`${isSmall ? 'text-[10px]' : 'text-xs'} font-medium text-gray-400 uppercase tracking-wide`} 
               style={{ writingMode: 'vertical-rl' }}
             >
              {weekdayShort}
            </span>
          </div>
       </div>
       <span className="absolute top-2 right-3 text-[10px] text-gray-300 font-bold">
         {year}
       </span>
    </div>
  );

  const renderGlass = () => (
    <div 
      className="flex flex-col h-full w-full relative overflow-hidden select-none shadow-sm rounded-xl font-outfit"
      style={{ 
        background: `linear-gradient(135deg, ${themeColor}80 0%, ${themeColor} 100%)`
      }}
    >
      {/* Glass Overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>
      
      {/* Decorative Circles */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>

      <div className="relative z-10 flex flex-col h-full p-3 text-white">
        <div className="flex justify-between items-start">
           <span className={`${isSmall ? 'text-sm' : 'text-lg'} font-bold uppercase tracking-widest opacity-90 font-serif`}>{month}</span>
           <span className="text-xs font-medium opacity-60">{year}</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
           <span className={`${isSmall ? 'text-6xl' : 'text-8xl'} font-bold tracking-tighter drop-shadow-lg font-serif`}>
             {day}
           </span>
        </div>
        
        <div className="text-center">
           <span className={`${isSmall ? 'text-[10px]' : 'text-sm'} font-medium uppercase tracking-wide opacity-80 bg-black/10 px-2 py-0.5 rounded-full backdrop-blur-md`}>
             {weekday}
           </span>
        </div>
      </div>
    </div>
  );

  const renderBauhaus = () => (
    <div className="flex h-full w-full bg-white relative overflow-hidden select-none shadow-sm rounded-xl font-bebas">
       {/* Left Section: Color Block */}
       <div 
         className="w-1/3 h-full flex items-center justify-center relative"
         style={{ backgroundColor: themeColor }}
       >
         <span 
           className={`${isSmall ? 'text-xl' : 'text-3xl'} font-bold text-white tracking-widest`}
           style={{ writingMode: 'vertical-rl' }}
         >
           {month}
         </span>
         {/* Decorative Circle */}
         <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/20 rounded-full"></div>
       </div>

       {/* Right Section: Dark or White */}
       <div className="w-2/3 h-full bg-[#1a1a1a] flex flex-col items-center justify-center relative">
         <span className={`${isSmall ? 'text-6xl' : 'text-8xl'} font-bold text-white leading-none tracking-wider`}>
           {day}
         </span>
         <span 
            className={`absolute bottom-2 right-2 ${isSmall ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-wider font-sans`}
            style={{ color: themeColor }}
         >
           {weekdayShort}
         </span>
         
         {/* Decorative Triangle */}
         <div 
           className="absolute top-0 right-0 w-0 h-0 border-l-transparent"
           style={{ 
             borderTopColor: themeColor,
             borderLeftWidth: isSmall ? '30px' : '40px',
             borderTopWidth: isSmall ? '30px' : '40px'
           }}
         ></div>
       </div>
    </div>
  );

  const style = widget.config?.style || 'classic';

  switch (style) {
    case 'minimal': return renderMinimal();
    case 'glass': return renderGlass();
    case 'bauhaus': return renderBauhaus();
    default: return renderClassic();
  }
});

DateWidget.displayName = 'DateWidget';

export default DateWidget;
