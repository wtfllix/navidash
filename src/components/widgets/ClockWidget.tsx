'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Widget } from '@/types';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

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
