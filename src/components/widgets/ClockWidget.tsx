'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Widget } from '@/types';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

const AnalogClock = ({ time }: { time: Date }) => {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();
  
  // Calculate smooth angles
  // Seconds: 6 degrees per second
  const secondAngle = seconds * 6;
  // Minutes: 6 degrees per minute + adjustment for seconds
  const minuteAngle = minutes * 6 + seconds * 0.1;
  // Hours: 30 degrees per hour + adjustment for minutes
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2">
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full max-w-[160px] max-h-[160px] drop-shadow-md"
      >
        {/* Clock Face Background */}
        <circle cx="50" cy="50" r="48" fill="white" stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Minute Markers (Small) */}
        {[...Array(60)].map((_, i) => {
          if (i % 5 === 0) return null; // Skip hour markers positions
          return (
            <line
              key={`min-${i}`}
              x1="50"
              y1="6"
              x2="50"
              y2="8"
              transform={`rotate(${i * 6} 50 50)`}
              stroke="#9ca3af"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Hour Markers (Large) */}
        {[...Array(12)].map((_, i) => (
          <line
            key={`hour-${i}`}
            x1="50"
            y1="6"
            x2="50"
            y2="12"
            transform={`rotate(${i * 30} 50 50)`}
            stroke="#1f2937"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}

        {/* Hour Hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="25"
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 50 50)`}
        />

        {/* Minute Hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="#374151"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 50 50)`}
        />

        {/* Second Hand (Red Swiss Style) */}
        <g transform={`rotate(${secondAngle} 50 50)`}>
          <line
            x1="50"
            y1="60"
            x2="50"
            y2="10"
            stroke="#ef4444"
            strokeWidth="1"
          />
          <circle cx="50" cy="10" r="2" fill="#ef4444" />
          <circle cx="50" cy="50" r="1.5" fill="#ef4444" />
        </g>
        
        {/* Center Cap */}
        <circle cx="50" cy="50" r="1" fill="white" />
      </svg>
    </div>
  );
};

const ClockWidget = React.memo(({ widget }: { widget: Widget }) => {
  const [time, setTime] = useState(new Date());
  const locale = useLocale();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = useMemo(() => {
    return time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }, [time, locale]);

  const dateString = useMemo(() => {
    return time.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
  }, [time, locale]);

  const isAnalog = widget.config?.clockStyle === 'analog';

  if (isAnalog) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
        <AnalogClock time={time} />
      </div>
    );
  }

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
});

ClockWidget.displayName = 'ClockWidget';

export default ClockWidget;
