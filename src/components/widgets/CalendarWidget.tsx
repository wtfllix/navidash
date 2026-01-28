"use client";
import React, { useMemo } from 'react';
import { Widget } from '@/types';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarWidget({ widget }: { widget: Widget }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const todayDate = today.getDate();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0=Sun
    const lastDate = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: number | null; isToday?: boolean }> = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null });
    for (let d = 1; d <= lastDate; d++) {
      const isToday = d === todayDate;
      cells.push({ date: d, isToday });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [year, month, todayDate]);

  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center mb-2">
        <CalendarIcon size={18} className="text-blue-600" />
        <div className="ml-2 font-semibold text-gray-800">{monthLabel}</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
        {weekLabels.map((w) => (
          <div key={w} className="text-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm flex-1">
        {days.map((d, i) => (
          <div
            key={i}
            className={"h-8 rounded flex items-center justify-center " + (d.isToday ? "bg-blue-50 text-blue-700 font-semibold" : "bg-gray-50 text-gray-700") + (d.date ? "" : " opacity-40") }
          >
            {d.date ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}
