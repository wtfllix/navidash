'use client';

import React from 'react';
import { Flag, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { WidgetOfType } from '@/types';
import {
  F1_SEASON,
  F1SessionType,
  getF1ScheduleView,
  getLocalizedF1Text,
} from '@/lib/f1Schedule';

const sessionLabelKeys: Record<F1SessionType, string> = {
  'practice-1': 'f1_practice_1',
  'practice-2': 'f1_practice_2',
  'practice-3': 'f1_practice_3',
  'sprint-qualifying': 'f1_sprint_qualifying',
  sprint: 'f1_sprint',
  qualifying: 'f1_qualifying',
  race: 'f1_race',
};

function formatSessionTime(value: string, locale: string, compact = false) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    ...(compact ? {} : { weekday: 'short' as const }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getCountdownLabel(
  startsAt: string,
  now: Date,
  t: ReturnType<typeof useTranslations<'Widgets'>>
) {
  const difference = new Date(startsAt).getTime() - now.getTime();
  if (difference <= 0) return t('f1_live');

  const minutes = Math.ceil(difference / 60_000);
  if (minutes < 60) return t('f1_starts_in_minutes', { count: minutes });

  const hours = Math.ceil(difference / 3_600_000);
  if (hours < 24) return t('f1_starts_in_hours', { count: hours });

  return t('f1_starts_in_days', { count: Math.ceil(difference / 86_400_000) });
}

interface F1WidgetProps {
  widget: WidgetOfType<'f1'>;
  previewDate?: Date;
}

export default function F1Widget({ widget, previewDate }: F1WidgetProps) {
  const locale = useLocale();
  const t = useTranslations('Widgets');
  const [now, setNow] = React.useState<Date | null>(previewDate ?? null);
  const isCompact = widget.size.h === 1;
  const showPractice = widget.config.showPractice ?? false;
  const showCountdown = widget.config.showCountdown ?? true;

  React.useEffect(() => {
    if (previewDate) {
      setNow(previewDate);
      return;
    }

    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [previewDate]);

  const view = now ? getF1ScheduleView(now, showPractice) : null;
  const round = view?.round;
  const nextSession = view?.nextSession;
  const roundName = round ? getLocalizedF1Text(round.name, locale) : '';
  const location = round ? getLocalizedF1Text(round.location, locale) : '';
  const visibleSessions = view?.sessions.slice(0, 3) ?? [];
  const remainingSessions = Math.max(0, (view?.sessions.length ?? 0) - visibleSessions.length);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#f8f7f4] text-slate-900"
      data-testid="f1-widget"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-red-600" />
      <div className="flex h-full min-w-0 flex-col px-4 py-3 pl-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Flag size={15} className="shrink-0 fill-red-600 text-red-600" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-700">
              F1 · {F1_SEASON.season}
            </span>
          </div>
          {round ? (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {t('f1_round', { count: round.round })}
            </span>
          ) : null}
        </div>

        {!view || !now ? (
          <div className="flex flex-1 items-center text-sm text-slate-400">{t('f1_loading')}</div>
        ) : view.state === 'complete' || !round || !nextSession ? (
          <div className="flex flex-1 flex-col justify-center">
            <div className="text-lg font-semibold tracking-[-0.02em]">{t('f1_season_complete')}</div>
            <div className="mt-1 text-xs text-slate-500">{t('f1_season_complete_hint')}</div>
          </div>
        ) : (
          <>
            <div className={isCompact ? 'mt-2 min-w-0' : 'mt-3 min-w-0'}>
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  className={
                    isCompact
                      ? 'truncate text-base font-semibold tracking-[-0.025em]'
                      : 'truncate text-xl font-semibold tracking-[-0.035em]'
                  }
                >
                  {roundName}
                </h3>
                {round.status === 'tentative' ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                    {t('f1_tentative')}
                  </span>
                ) : null}
              </div>
              {!isCompact ? (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin size={12} aria-hidden="true" />
                  <span>{location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('f1_local_time')}</span>
                </div>
              ) : null}
            </div>

            <div
              className={
                isCompact
                  ? 'mt-auto flex min-w-0 items-end justify-between gap-3'
                  : 'mt-3 flex min-w-0 items-end justify-between gap-3 border-b border-slate-200 pb-3'
              }
            >
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600">
                  {view.isActive ? t('f1_now') : t('f1_next')}
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {t(sessionLabelKeys[nextSession.type])}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-medium tabular-nums text-slate-700">
                  {formatSessionTime(nextSession.startsAt, locale, isCompact)}
                </div>
                {showCountdown ? (
                  <div className="mt-1 text-[10px] font-semibold text-red-600">
                    {getCountdownLabel(nextSession.startsAt, now, t)}
                  </div>
                ) : null}
              </div>
            </div>

            {!isCompact ? (
              <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-hidden">
                {visibleSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 py-1 text-xs"
                  >
                    <span
                      className={
                        session.id === nextSession.id
                          ? 'truncate font-semibold text-red-700'
                          : 'truncate font-medium text-slate-600'
                      }
                    >
                      {t(sessionLabelKeys[session.type])}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {formatSessionTime(session.startsAt, locale, true)}
                    </span>
                  </div>
                ))}
                {remainingSessions > 0 ? (
                  <div className="pt-0.5 text-[10px] text-slate-400">
                    {t('f1_more_sessions', { count: remainingSessions })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
