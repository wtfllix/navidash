import {
  F1_SEASON,
  F1SeasonSchema,
  getF1ScheduleView,
  getLocalizedF1Text,
} from '@/lib/f1Schedule';

describe('F1 schedule data', () => {
  it('loads the normalized bilingual 2026 season', () => {
    expect(F1SeasonSchema.safeParse(F1_SEASON).success).toBe(true);
    expect(F1_SEASON.rounds).toHaveLength(23);
    expect(F1_SEASON.rounds.flatMap((round) => round.sessions)).toHaveLength(115);
    expect(F1_SEASON.rounds[11]).toMatchObject({
      id: 'netherlands',
      name: { zh: '荷兰大奖赛', en: 'Dutch Grand Prix' },
      location: { zh: '赞德沃特', en: 'Zandvoort' },
    });
    expect(getLocalizedF1Text(F1_SEASON.rounds[11].name, 'zh-CN')).toBe('荷兰大奖赛');
    expect(getLocalizedF1Text(F1_SEASON.rounds[11].name, 'en')).toBe('Dutch Grand Prix');
  });

  it('selects the next relevant session and hides practice by default', () => {
    const now = new Date('2026-08-15T00:00:00Z');
    const defaultView = getF1ScheduleView(now);
    const completeView = getF1ScheduleView(now, true);

    expect(defaultView.round?.id).toBe('netherlands');
    expect(defaultView.nextSession?.type).toBe('sprint-qualifying');
    expect(completeView.nextSession?.type).toBe('practice-1');
  });

  it('marks an in-progress session and preserves tentative rounds', () => {
    const liveView = getF1ScheduleView(new Date('2026-08-22T10:15:00Z'));
    const tentativeView = getF1ScheduleView(new Date('2026-09-27T00:00:00Z'));

    expect(liveView.nextSession?.type).toBe('sprint');
    expect(liveView.isActive).toBe(true);
    expect(tentativeView.round).toMatchObject({
      id: 'bahrain-malaysia-tbc',
      status: 'tentative',
    });
  });

  it('reports completion after the final race', () => {
    expect(getF1ScheduleView(new Date('2026-12-06T16:00:00Z'))).toMatchObject({
      state: 'complete',
      round: null,
      nextSession: null,
    });
  });
});
