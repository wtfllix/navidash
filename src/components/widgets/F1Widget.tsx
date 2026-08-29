'use client';

import React from 'react';
import { Flag, MapPin, Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { WidgetOfType } from '@/types';
import {
  F1_SEASON,
  F1SessionType,
  getF1ScheduleView,
  getLocalizedF1Text,
} from '@/lib/f1Schedule';
import { fetchF1Standings, F1StandingsResponse } from '@/lib/f1Standings';

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

function useF1Standings(enabled: boolean) {
  const [data, setData] = React.useState<F1StandingsResponse | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setError(false);

    fetchF1Standings(controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(true);
      });

    return () => controller.abort();
  }, [enabled]);

  return { data, error };
}

export default function F1Widget({ widget, previewDate }: F1WidgetProps) {
  const locale = useLocale();
  const t = useTranslations('Widgets');
  const [now, setNow] = React.useState<Date | null>(previewDate ?? null);
  const isStandings = widget.config.view === 'standings';
  const standingsState = useF1Standings(isStandings);
  const isCompact = widget.size.h === 1;
  const isWideStandings = isStandings && widget.size.w >= 3 && widget.size.h >= 2;
  const isSquare = widget.size.w === widget.size.h;
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
  const standingsCount = isCompact ? 3 : isWideStandings ? standingsState.data?.standings.length : 4;
  const visibleStandings = standingsState.data?.standings.slice(0, standingsCount) ?? [];
  const standingsRowsPerColumn = Math.ceil(visibleStandings.length / 3);
  const displayedRound = isStandings ? standingsState.data?.round : round?.round;

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#f8f7f4] text-slate-900"
      data-testid="f1-widget"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.05] ${
          isSquare ? 'scale-[1.36]' : ''
        }`}
        style={{ backgroundImage: "url('/f1-checkered-flag.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 w-1.5 bg-red-600" />
      <div className="relative z-[1] flex h-full min-w-0 flex-col px-4 py-3 pl-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Flag size={15} className="shrink-0 fill-red-600 text-red-600" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-700">
              F1 · {F1_SEASON.season}
            </span>
          </div>
          {displayedRound ? (
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {t('f1_round', { count: displayedRound })}
            </span>
          ) : null}
        </div>

        {isStandings ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={isCompact ? 'mt-2 flex items-center gap-2' : 'mt-3 flex items-center gap-2'}>
              <Trophy size={isCompact ? 15 : 17} className="shrink-0 text-red-600" aria-hidden="true" />
              <h3
                className={
                  isCompact
                    ? 'text-base font-semibold tracking-[-0.025em]'
                    : 'text-xl font-semibold tracking-[-0.035em]'
                }
              >
                {t('f1_driver_standings')}
              </h3>
              {standingsState.data?.stale ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
                  {t('f1_standings_cached')}
                </span>
              ) : null}
            </div>

            {!standingsState.data && !standingsState.error ? (
              <div className="flex flex-1 items-center text-sm text-slate-400">
                {t('f1_standings_loading')}
              </div>
            ) : standingsState.error && !standingsState.data ? (
              <div className="flex flex-1 flex-col justify-center">
                <div className="text-sm font-semibold text-slate-700">
                  {t('f1_standings_unavailable')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {t('f1_standings_unavailable_hint')}
                </div>
              </div>
            ) : (
              <div
                className={
                  isCompact
                    ? 'mt-2 grid grid-cols-3 gap-2 pb-1'
                    : isWideStandings
                      ? 'mt-2 grid min-h-0 flex-1 grid-flow-col grid-cols-3 gap-x-3'
                      : 'mt-3 min-h-0 flex-1 pb-1'
                }
                style={
                  isWideStandings
                    ? { gridTemplateRows: `repeat(${standingsRowsPerColumn}, minmax(0, 1fr))` }
                    : undefined
                }
              >
                {visibleStandings.map((standing) => (
                  <div
                    key={standing.position}
                    className={
                      isCompact
                        ? 'grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-1 border-l-2 border-slate-200 pl-2 first:border-red-500'
                        : isWideStandings
                          ? 'flex min-w-0 items-center gap-1.5 text-[10px]'
                          : 'flex items-center gap-3 py-1 text-xs'
                    }
                  >
                    <span
                      className={
                        isCompact
                          ? 'text-[10px] font-bold tabular-nums text-red-600'
                          : `${isWideStandings ? 'w-4' : 'w-5'} shrink-0 text-center font-bold tabular-nums ${
                              standing.position === 1 ? 'text-red-600' : 'text-slate-400'
                            }`
                      }
                    >
                      {standing.position}
                    </span>
                    <span
                      className={
                        isCompact
                          ? 'min-w-0 truncate text-xs font-semibold'
                          : 'min-w-0 flex-1'
                      }
                    >
                      <span
                        className={
                          isCompact ? '' : 'block truncate font-semibold text-slate-800'
                        }
                        title={`${standing.givenName} ${standing.familyName}`}
                      >
                        {isCompact ? standing.code : standing.familyName}
                      </span>
                      {!isCompact && !isWideStandings ? (
                        <span className="block truncate text-[10px] text-slate-400">
                          {standing.code} · {standing.constructor}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={
                        isCompact
                          ? 'col-span-2 mt-0.5 block truncate text-[10px] font-medium tabular-nums text-slate-500'
                          : isWideStandings
                            ? 'shrink-0 font-medium tabular-nums text-slate-500'
                            : 'shrink-0 font-semibold tabular-nums text-slate-700'
                      }
                    >
                      {t('f1_points', { count: standing.points })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !view || !now ? (
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
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
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
                  : 'mt-3 flex min-w-0 items-end justify-between gap-3 pb-3'
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
