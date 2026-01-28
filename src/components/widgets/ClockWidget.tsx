'use client';

import React, { useState, useEffect } from 'react';
import { Widget } from '@/types';
import { cn } from '@/lib/utils';

export default function ClockWidget({ widget }: { widget: Widget }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white rounded-xl">
      <div className="text-4xl font-bold text-gray-800 tracking-tight">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm text-gray-500 mt-1 font-medium">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}
