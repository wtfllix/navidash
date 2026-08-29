import { z } from 'zod';
import { F1_SEASON_2026 } from '@/lib/f1Season2026.generated';

export const F1SessionTypeSchema = z.enum([
  'practice-1',
  'practice-2',
  'practice-3',
  'sprint-qualifying',
  'sprint',
  'qualifying',
  'race',
]);

const F1StatusSchema = z.enum(['confirmed', 'tentative', 'cancelled']);
const LocalizedTextSchema = z.object({ zh: z.string().min(1), en: z.string().min(1) }).strict();

export const F1SeasonSchema = z
  .object({
    schemaVersion: z.literal(1),
    season: z.number().int().positive(),
    source: z.string().min(1),
    sourceUpdatedAt: z.string().datetime(),
    rounds: z.array(
      z
        .object({
          round: z.number().int().positive(),
          id: z.string().min(1),
          name: LocalizedTextSchema,
          location: LocalizedTextSchema,
          coordinates: z
            .object({
              latitude: z.number().finite(),
              longitude: z.number().finite(),
            })
            .strict(),
          status: F1StatusSchema,
          sessions: z.array(
            z
              .object({
                id: z.string().min(1),
                type: F1SessionTypeSchema,
                startsAt: z.string().datetime(),
                endsAt: z.string().datetime(),
                status: F1StatusSchema,
              })
              .strict()
          ),
        })
        .strict()
    ),
  })
  .strict();

export type F1SessionType = z.infer<typeof F1SessionTypeSchema>;
export type F1Season = z.infer<typeof F1SeasonSchema>;
export type F1Round = F1Season['rounds'][number];
export type F1Session = F1Round['sessions'][number];

export const F1_SEASON = F1SeasonSchema.parse(F1_SEASON_2026);

const practiceTypes = new Set<F1SessionType>(['practice-1', 'practice-2', 'practice-3']);

export function isF1PracticeSession(type: F1SessionType) {
  return practiceTypes.has(type);
}

export function getLocalizedF1Text(value: { zh: string; en: string }, locale: string) {
  return locale.toLowerCase().startsWith('zh') ? value.zh : value.en;
}

export function getF1ScheduleView(now: Date, showPractice = false) {
  const nowTime = now.getTime();
  const candidates = F1_SEASON.rounds.flatMap((round) =>
    round.sessions
      .filter(
        (session) =>
          session.status !== 'cancelled' &&
          (showPractice || !isF1PracticeSession(session.type)) &&
          new Date(session.endsAt).getTime() > nowTime
      )
      .map((session) => ({ round, session }))
  );
  candidates.sort(
    (left, right) =>
      new Date(left.session.startsAt).getTime() - new Date(right.session.startsAt).getTime()
  );

  const next = candidates[0];
  if (!next) {
    return {
      state: 'complete' as const,
      round: null,
      nextSession: null,
      sessions: [] as F1Session[],
      isActive: false,
    };
  }

  const sessions = next.round.sessions.filter(
    (session) =>
      session.status !== 'cancelled' &&
      (showPractice || !isF1PracticeSession(session.type)) &&
      new Date(session.endsAt).getTime() > nowTime
  );
  const startsAt = new Date(next.session.startsAt).getTime();

  return {
    state: 'upcoming' as const,
    round: next.round,
    nextSession: next.session,
    sessions,
    isActive: startsAt <= nowTime,
  };
}
