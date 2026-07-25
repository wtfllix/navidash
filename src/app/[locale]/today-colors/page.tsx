'use client';

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/navigation';
import TodayWidget, { getTodayAccent } from '@/components/widgets/TodayWidget';
import type { WidgetOfType } from '@/types';

function createPreviewWidget(index: number): WidgetOfType<'today'> {
  return {
    id: `today-color-preview-${index}`,
    type: 'today',
    size: { w: 2, h: 2 },
    position: { x: 0, y: 0 },
    config: {},
  };
}

export default function TodayColorsPreviewPage() {
  const locale = useLocale();
  const isChinese = locale === 'zh';
  const dates = React.useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#eef1f5] px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1540px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              {isChinese ? '返回首页' : 'Back home'}
            </Link>
            <h1 className="font-outfit text-3xl font-light tracking-[-0.04em] text-slate-900">
              {isChinese ? 'Today 每日强调色' : 'Today daily accents'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isChinese
                ? '连续展示未来 8 天的完整色板。第一张是今天实际使用的颜色，次日会自动切换到下一张。'
                : 'The full eight-day palette. The first card is today’s active color; the next one activates tomorrow.'}
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm">
            {isChinese ? '仅供视觉预览，不修改任何配置' : 'Preview only — no settings are changed'}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {dates.map((date, index) => {
            const accent = getTodayAccent(date);
            const dateLabel = new Intl.DateTimeFormat(isChinese ? 'zh-CN' : 'en-US', {
              month: 'short',
              day: 'numeric',
              weekday: 'short',
            }).format(date);

            return (
              <section key={date.toISOString()} className="min-w-0">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{ backgroundColor: accent.color }}
                    />
                    <span className="text-sm font-semibold text-slate-700">{dateLabel}</span>
                    {index === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Check size={10} />
                        {isChinese ? '今天' : 'Today'}
                      </span>
                    )}
                  </div>
                  <code className="text-[11px] uppercase text-slate-400">{accent.color}</code>
                </div>
                <div className="h-[300px] overflow-hidden rounded-[var(--radius-widget)] shadow-[0_14px_38px_rgba(15,23,42,0.12)]">
                  <TodayWidget widget={createPreviewWidget(index)} previewDate={date} />
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
