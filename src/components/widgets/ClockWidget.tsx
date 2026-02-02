'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Widget } from '@/types';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

// --- Classic Analog Clock ---
const ClassicClock = ({ time }: { time: Date }) => {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();
  
  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-3">
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full max-w-[200px] max-h-[200px]"
      >
        <circle cx="50" cy="50" r="48" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        
        {/* Ticks */}
        {[...Array(60)].map((_, i) => {
           const isHour = i % 5 === 0;
           const length = isHour ? 5 : 2;
           const width = isHour ? 1.5 : 0.5;
           const color = isHour ? "#1f2937" : "#9ca3af";
           return (
             <line
               key={i}
               x1="50" y1="4"
               x2="50" y2={4 + length}
               transform={`rotate(${i * 6} 50 50)`}
               stroke={color}
               strokeWidth={width}
               strokeLinecap="round"
             />
           );
        })}

        {/* Numbers */}
        {[...Array(12)].map((_, i) => {
          const num = i + 1;
          const angleDeg = num * 30 - 90;
          const angleRad = angleDeg * (Math.PI / 180);
          const r = 34;
          const x = 50 + r * Math.cos(angleRad);
          const y = 50 + r * Math.sin(angleRad);
          
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-bold fill-gray-600 font-sans"
              style={{ fontSize: '8px' }}
            >
              {num}
            </text>
          );
        })}

        {/* Hands */}
        <line x1="50" y1="50" x2="50" y2="26" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hourAngle} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="16" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minuteAngle} 50 50)`} />
        
        {/* Second Hand (Swiss Style) */}
        <g transform={`rotate(${secondAngle} 50 50)`}>
          <line x1="50" y1="60" x2="50" y2="10" stroke="#ef4444" strokeWidth="1" />
          <circle cx="50" cy="10" r="1.5" fill="#ef4444" />
        </g>
        <circle cx="50" cy="50" r="2" fill="white" stroke="#ef4444" strokeWidth="1" />
      </svg>
    </div>
  );
};

// --- Apple Watch Style (Modern Analog) ---
const AppleWatchClock = ({ time }: { time: Date }) => {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();
  
  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  // Date Complication
  const day = time.getDate();
  const weekday = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <div className="relative w-full h-full flex items-center justify-center rounded-full overflow-hidden">
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full max-w-[200px] max-h-[200px]"
      >
        {/* Dark Background is handled by container, but we can add a subtle gradient circle if needed */}
        
        {/* Minimal Ticks */}
        {[...Array(12)].map((_, i) => {
           const isCardinal = i % 3 === 0;
           return (
             <line
               key={i}
               x1="50" y1="2"
               x2="50" y2={isCardinal ? 8 : 5}
               transform={`rotate(${i * 30} 50 50)`}
               stroke={isCardinal ? "#fff" : "#666"}
               strokeWidth={isCardinal ? 2 : 1}
               strokeLinecap="round"
               opacity={0.8}
             />
           );
        })}

        {/* Date Complication (Right side) */}
        <g transform="translate(72, 50)">
           <text x="0" y="-3" textAnchor="middle" className="fill-gray-400 text-[6px] font-medium tracking-wider">{weekday}</text>
           <text x="0" y="5" textAnchor="middle" className="fill-white text-[8px] font-bold">{day}</text>
        </g>

        {/* Hour Hand */}
        <line 
          x1="50" y1="50" x2="50" y2="25" 
          stroke="white" strokeWidth="4" strokeLinecap="round" 
          transform={`rotate(${hourAngle} 50 50)`} 
        />
        
        {/* Minute Hand */}
        <line 
          x1="50" y1="50" x2="50" y2="12" 
          stroke="white" strokeWidth="3" strokeLinecap="round" 
          transform={`rotate(${minuteAngle} 50 50)`} 
        />

        {/* Second Hand (Orange) */}
        <line 
          x1="50" y1="60" x2="50" y2="10" 
          stroke="#ff9500" strokeWidth="1" 
          transform={`rotate(${secondAngle} 50 50)`} 
        />
        <circle cx="50" cy="50" r="1.5" fill="#ff9500" />
      </svg>
    </div>
  );
};

// --- Flip Clock Style ---
const FlipClock = ({ time }: { time: Date }) => {
  const format = (num: number) => num.toString().padStart(2, '0');
  const hours = format(time.getHours());
  const minutes = format(time.getMinutes());
  const seconds = format(time.getSeconds());

  const Card = ({ value, label }: { value: string, label?: string }) => (
    <div className="flex flex-col items-center mx-1">
      <div className="relative bg-[#222] rounded-lg overflow-hidden shadow-xl border border-white/10 w-full h-auto aspect-[3/4] min-w-[3rem] max-w-[5rem] flex items-center justify-center">
        {/* Top Half Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 z-10 pointer-events-none"></div>
        {/* Middle Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/50 z-20"></div>
        
        <span className="text-3xl sm:text-5xl font-bold font-mono text-[#e5e5e5] tracking-widest z-0">
          {value}
        </span>
      </div>
      {label && <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-400 mt-1 sm:mt-2 font-medium">{label}</span>}
    </div>
  );

  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <Card value={hours} label="HOURS" />
      <div className="text-2xl text-gray-600 font-bold mb-6 mx-1 animate-pulse">:</div>
      <Card value={minutes} label="MINUTES" />
      <div className="hidden sm:block text-2xl text-gray-600 font-bold mb-6 mx-1 animate-pulse">:</div>
      <div className="hidden sm:block">
        <Card value={seconds} label="SECONDS" />
      </div>
    </div>
  );
};

// --- Digital Clock (Default) ---
const DigitalClock = ({ time, locale }: { time: Date, locale: string }) => {
  const timeString = time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const dateString = time.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white rounded-xl">
      <div className="text-4xl font-bold text-gray-800 tracking-tight">
        {timeString}
      </div>
      <div className="text-sm text-gray-500 mt-1 font-medium">
        {dateString}
      </div>
    </div>
  );
};

const ClockWidget = React.memo(({ widget }: { widget: Widget }) => {
  const [time, setTime] = useState<Date | null>(null);
  const locale = useLocale();

  useEffect(() => {
    setTime(new Date()); // Initialize on client
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    // Skeleton / Loading state to prevent hydration mismatch
    return <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl"></div>;
  }

  const style = widget.config?.clockStyle || 'digital';

  switch (style) {
    case 'analog':
      return (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <ClassicClock time={time} />
        </div>
      );
    case 'apple':
      return (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <AppleWatchClock time={time} />
        </div>
      );
    case 'flip':
      return (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <FlipClock time={time} />
        </div>
      );
    case 'digital':
    default:
      return <DigitalClock time={time} locale={locale} />;
  }
});

ClockWidget.displayName = 'ClockWidget';

export default ClockWidget;
