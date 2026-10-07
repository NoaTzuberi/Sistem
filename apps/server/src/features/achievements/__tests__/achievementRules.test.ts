import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_CONFIG, ACHIEVEMENT_DEFINITIONS } from '../achievement.definitions';
import { resolveProgress, resolveUnlocks } from '../achievementEvaluation';
import { METRICS } from '../achievementMetrics';
import type { AchievementHistory, AchievementRuleConfig, BodyDayFact, CompletedLogFact, PersonalRecordFact } from '../achievementMetrics';
import type { PlanWeek } from '../streak';

// One test group per rule of the config (PRD §7, Phase 11). Pure: histories are built
// by hand, so every rule is checked without a database.

const TODAY = '2026-10-07'; // a Wednesday; this week starts on 2026-10-04

function at(day: string, hour = 9): Date {
  return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00Z`);
}

/** `count` completed logs, one a day from `firstDay`. */
function logs(count: number, firstDay = '2026-01-01', fields: Partial<CompletedLogFact> = {}): CompletedLogFact[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `log-${index + 1}`,
    finishedAt: new Date(at(firstDay).getTime() + index * 86_400_000),
    planId: 'plan',
    workoutId: `w-${index + 1}`,
    totalVolume: 0,
    pumpPhotoAt: null,
    ...fields,
  }));
}

function history(fields: Partial<AchievementHistory> = {}): AchievementHistory {
  return { timezone: 'Asia/Jerusalem', today: TODAY, logs: [], personalRecords: [], bodyDays: [], planWeeks: [], ...fields };
}

function unlocks(h: AchievementHistory, config: AchievementRuleConfig = ACHIEVEMENT_CONFIG) {
  return resolveUnlocks(ACHIEVEMENT_DEFINITIONS, h, config);
}

function keys(h: AchievementHistory, config?: AchievementRuleConfig): string[] {
  return unlocks(h, config).map((unlock) => unlock.key);
}

function unlock(h: AchievementHistory, key: string) {
  return unlocks(h).find((candidate) => candidate.key === key);
}

function pr(index: number, type: PersonalRecordFact['type']): PersonalRecordFact {
  return { logId: `log-${index}`, type, at: new Date(at('2026-03-01').getTime() + index * 60_000) };
}

function bodyDay(id: string, day: string, fields: Partial<BodyDayFact> = {}): BodyDayFact {
  return { id, createdAt: at(day), hasWeight: false, hasMeasurements: false, photoUploadedAt: [], ...fields };
}

function planWeek(weekStartDate: string, planned: number, done: number): PlanWeek {
  return {
    weekStartDate,
    planned,
    done: Array.from({ length: done }, (_, index) => ({ at: at(weekStartDate, 10 + index), logId: `${weekStartDate}-${index}` })),
  };
}

describe('the config', () => {
  it('every type is defined once, on a metric that exists', () => {
    const types = ACHIEVEMENT_DEFINITIONS.map((definition) => definition.type);
    expect(new Set(types).size).toBe(types.length);
    for (const definition of ACHIEVEMENT_DEFINITIONS) expect(METRICS[definition.metric]).toBeTypeOf('function');
  });

  it('defaults: a streak week needs every workout; a comeback needs 14 days', () => {
    expect(ACHIEVEMENT_CONFIG).toEqual({ streakWeekCompletionRatio: 1, comebackGapDays: 14 });
  });

  it('no achievement reads body weight values (PRD §7) — weigh-ins only count days', () => {
    const lighter = history({ bodyDays: [bodyDay('a', '2026-01-01', { hasWeight: true }), bodyDay('b', '2026-02-01', { hasWeight: true })] });
    expect(keys(lighter)).toEqual([]);
  });

  it('an empty history earns nothing', () => {
    expect(keys(history())).toEqual([]);
  });
});

describe('workout count: first_workout, workouts_5 / 10 / 25 / 50 / 100', () => {
  it('the first completed workout', () => {
    const h = history({ logs: logs(1) });
    expect(keys(h)).toEqual(['first_workout']);
    expect(unlock(h, 'first_workout')).toMatchObject({ value: 1, sourceLogId: 'log-1', at: at('2026-01-01') });
  });

  it('4 workouts: only the first; 5: workouts_5 from the 5th log', () => {
    expect(keys(history({ logs: logs(4) }))).toEqual(['first_workout']);
    const h = history({ logs: logs(5) });
    expect(keys(h)).toEqual(['first_workout', 'workouts_5']);
    expect(unlock(h, 'workouts_5')).toMatchObject({ value: 5, sourceLogId: 'log-5' });
  });

  it('each milestone at its own log, up to 100', () => {
    const h = history({ logs: logs(100) });
    for (const count of [10, 25, 50, 100]) {
      expect(unlock(h, `workouts_${count}`)).toMatchObject({ value: count, sourceLogId: `log-${count}` });
    }
    expect(keys(history({ logs: logs(99) }))).not.toContain('workouts_100');
  });
});

describe('personal records: first_weight_pr, first_reps_pr, prs_10 / 25 / 50', () => {
  it('a duration PR alone earns neither first', () => {
    expect(keys(history({ personalRecords: [pr(1, 'duration')] }))).toEqual([]);
  });

  it('the first weight PR and the first reps PR, each from its own log', () => {
    const h = history({ personalRecords: [pr(1, 'reps'), pr(2, 'weight'), pr(3, 'weight')] });
    expect(keys(h)).toEqual(['first_weight_pr', 'first_reps_pr']);
    expect(unlock(h, 'first_weight_pr')?.sourceLogId).toBe('log-2');
    expect(unlock(h, 'first_reps_pr')?.sourceLogId).toBe('log-1');
  });

  it('PR count milestones count every type, in time order', () => {
    const types: PersonalRecordFact['type'][] = ['weight', 'reps', 'duration'];
    const records = Array.from({ length: 50 }, (_, index) => pr(index + 1, types[index % 3])).reverse();
    const h = history({ personalRecords: records });
    expect(unlock(h, 'prs_10')).toMatchObject({ value: 10, sourceLogId: 'log-10' });
    expect(unlock(h, 'prs_25')?.sourceLogId).toBe('log-25');
    expect(unlock(h, 'prs_50')?.sourceLogId).toBe('log-50');
    expect(keys(history({ personalRecords: records.slice(0, 9) }))).not.toContain('prs_10');
  });
});

describe('lifetime volume: volume_10k / 50k / 100k / 500k / 1m', () => {
  it('unlocks at the log that crosses each line', () => {
    const h = history({ logs: logs(6, '2026-01-01', { totalVolume: 4_000 }) });
    // 4k, 8k, 12k … — 10k is crossed by the 3rd log.
    expect(unlock(h, 'volume_10k')).toMatchObject({ value: 10_000, sourceLogId: 'log-3' });
    expect(keys(h)).not.toContain('volume_50k');
  });

  it('all lines up to a million', () => {
    const h = history({ logs: logs(10, '2026-01-01', { totalVolume: 100_000 }) });
    expect(unlock(h, 'volume_50k')?.sourceLogId).toBe('log-1');
    expect(unlock(h, 'volume_100k')?.sourceLogId).toBe('log-1');
    expect(unlock(h, 'volume_500k')?.sourceLogId).toBe('log-5');
    expect(unlock(h, 'volume_1m')?.sourceLogId).toBe('log-10');
  });
});

describe('perfect_week (repeatable, always 100%)', () => {
  it('one unlock per complete week, keyed by the week', () => {
    const h = history({ planWeeks: [planWeek('2026-09-20', 2, 2), planWeek('2026-09-27', 3, 2), planWeek('2026-10-04', 1, 1)] });
    const perfect = unlocks(h).filter((candidate) => candidate.type === 'perfect_week');
    expect(perfect.map((candidate) => candidate.key)).toEqual(['perfect_week:2026-09-20', 'perfect_week:2026-10-04']);
    expect(perfect[0]).toMatchObject({ sourceLogId: '2026-09-20-1', at: at('2026-09-20', 11) });
  });

  it('a 3 of 4 week is no perfect week even at streak ratio 0.75', () => {
    const h = history({ planWeeks: [planWeek('2026-09-27', 4, 3)] });
    expect(keys(h, { ...ACHIEVEMENT_CONFIG, streakWeekCompletionRatio: 0.75 })).not.toContain('perfect_week:2026-09-27');
  });
});

describe('streak_2 / 4 / 8 / 12 / 26 / 52', () => {
  const weeksBack = (count: number, planned: number, done: number) =>
    Array.from({ length: count }, (_, index) => {
      const start = new Date(at('2026-10-04').getTime() - (count - 1 - index) * 7 * 86_400_000).toISOString().slice(0, 10);
      return planWeek(start, planned, done);
    });

  it('two complete weeks in a row', () => {
    const h = history({ planWeeks: weeksBack(2, 2, 2) });
    expect(unlock(h, 'streak_2')).toMatchObject({ value: 2, sourceLogId: '2026-10-04-1' });
    expect(keys(h)).not.toContain('streak_4');
  });

  it('every milestone up to 52 weeks', () => {
    const h = history({ planWeeks: weeksBack(52, 1, 1) });
    for (const weeks of [2, 4, 8, 12, 26, 52]) expect(keys(h)).toContain(`streak_${weeks}`);
  });

  it('the longest run counts even when the streak is broken now', () => {
    const planWeeks = [planWeek('2026-09-06', 1, 1), planWeek('2026-09-13', 1, 1), planWeek('2026-09-20', 1, 0)];
    expect(keys(history({ planWeeks }))).toContain('streak_2');
  });

  it('a week that ended incomplete in between: no streak_2', () => {
    const planWeeks = [planWeek('2026-09-13', 1, 1), planWeek('2026-09-20', 2, 1), planWeek('2026-09-27', 1, 1)];
    expect(keys(history({ planWeeks }))).not.toContain('streak_2');
  });

  it('weeks without a plan in between are neutral', () => {
    const planWeeks = [planWeek('2026-09-06', 1, 1), planWeek('2026-09-27', 1, 1)];
    expect(keys(history({ planWeeks }))).toContain('streak_2');
  });

  it('ratio 1.0: 3 of 4 breaks; ratio 0.75: 3 of 4 counts', () => {
    const planWeeks = weeksBack(2, 4, 3);
    expect(keys(history({ planWeeks }))).not.toContain('streak_2');
    const relaxed = { ...ACHIEVEMENT_CONFIG, streakWeekCompletionRatio: 0.75 };
    expect(keys(history({ planWeeks }), relaxed)).toContain('streak_2');
  });
});

describe('comeback (repeatable)', () => {
  function logAt(id: string, iso: string): CompletedLogFact {
    return { id, finishedAt: new Date(iso), planId: 'plan', workoutId: id, totalVolume: 0, pumpPhotoAt: null };
  }

  it('a workout 14+ days after the one before, keyed by its log', () => {
    const h = history({ logs: [logAt('a', '2026-09-01T09:00:00Z'), logAt('b', '2026-09-15T09:00:00Z')] });
    expect(unlock(h, 'comeback:b')).toMatchObject({ type: 'comeback', value: 14, sourceLogId: 'b' });
  });

  it('13 days is not a comeback', () => {
    const h = history({ logs: [logAt('a', '2026-09-01T09:00:00Z'), logAt('b', '2026-09-14T20:00:00Z')] });
    expect(keys(h).filter((key) => key.startsWith('comeback'))).toEqual([]);
  });

  it('the first workout ever is no comeback', () => {
    expect(keys(history({ logs: [logAt('a', '2026-09-01T09:00:00Z')] }))).toEqual(['first_workout']);
  });

  it('days are calendar days in her time zone', () => {
    // 22:30 UTC on 1 Sep is already 2 Sep in Jerusalem: 13 days to 15 Sep.
    const h = history({ logs: [logAt('a', '2026-09-01T22:30:00Z'), logAt('b', '2026-09-15T09:00:00Z')] });
    expect(keys(h)).not.toContain('comeback:b');
    expect(keys({ ...h, timezone: 'UTC' })).toContain('comeback:b');
  });

  it('every comeback counts once', () => {
    const h = history({
      logs: [logAt('a', '2026-06-01T09:00:00Z'), logAt('b', '2026-07-01T09:00:00Z'), logAt('c', '2026-07-02T09:00:00Z'), logAt('d', '2026-08-01T09:00:00Z')],
    });
    expect(keys(h).filter((key) => key.startsWith('comeback'))).toEqual(['comeback:b', 'comeback:d']);
  });

  it('a different gap from the config', () => {
    const h = history({ logs: [logAt('a', '2026-09-01T09:00:00Z'), logAt('b', '2026-09-08T09:00:00Z')] });
    expect(keys(h, { ...ACHIEVEMENT_CONFIG, comebackGapDays: 7 })).toContain('comeback:b');
  });
});

describe('first_pump_photo', () => {
  it('dated to the upload, from that log', () => {
    const [first, second] = logs(2);
    const h = history({ logs: [{ ...first, pumpPhotoAt: at('2026-02-10') }, { ...second, pumpPhotoAt: at('2026-01-05') }] });
    expect(unlock(h, 'first_pump_photo')).toMatchObject({ value: 1, sourceLogId: 'log-2', at: at('2026-01-05') });
  });
});

describe('body: first_measurement, first_progress_photo, weigh_ins_10', () => {
  it('the first day with measurements', () => {
    const h = history({ bodyDays: [bodyDay('w', '2026-01-01', { hasWeight: true }), bodyDay('m', '2026-01-03', { hasMeasurements: true })] });
    expect(keys(h)).toEqual(['first_measurement']);
    expect(unlock(h, 'first_measurement')).toMatchObject({ sourceBodyMetricId: 'm', at: at('2026-01-03') });
  });

  it('the first progress photo, dated to its upload', () => {
    const h = history({ bodyDays: [bodyDay('p', '2026-01-01', { photoUploadedAt: [at('2026-01-02'), at('2026-01-01', 12)] })] });
    expect(unlock(h, 'first_progress_photo')).toMatchObject({ sourceBodyMetricId: 'p', at: at('2026-01-01', 12) });
  });

  it('10 days with a weight', () => {
    const days = Array.from({ length: 10 }, (_, index) => bodyDay(`d${index + 1}`, `2026-01-${String(index + 1).padStart(2, '0')}`, { hasWeight: true }));
    expect(keys(history({ bodyDays: days.slice(0, 9) }))).toEqual([]);
    expect(unlock(history({ bodyDays: days }), 'weigh_ins_10')).toMatchObject({ value: 10, sourceBodyMetricId: 'd10' });
  });
});

describe('progress', () => {
  it('current value, threshold and times unlocked per definition', () => {
    const h = history({ logs: logs(7), planWeeks: [planWeek('2026-09-27', 1, 1), planWeek('2026-10-04', 1, 1)] });
    const progress = resolveProgress(ACHIEVEMENT_DEFINITIONS, h, ACHIEVEMENT_CONFIG, [
      { type: 'first_workout', unlockedAt: at('2026-01-01') },
      { type: 'perfect_week', unlockedAt: at('2026-09-27') },
      { type: 'perfect_week', unlockedAt: at('2026-10-04') },
    ]);
    const byType = new Map(progress.map((entry) => [entry.type, entry]));
    expect(progress.map((entry) => entry.type)).toEqual(ACHIEVEMENT_DEFINITIONS.map((definition) => definition.type));
    expect(byType.get('workouts_10')).toEqual({ type: 'workouts_10', repeatable: false, threshold: 10, current: 7, count: 0, unlockedAt: null });
    expect(byType.get('first_workout')).toMatchObject({ count: 1, unlockedAt: at('2026-01-01').toISOString() });
    expect(byType.get('perfect_week')).toEqual({
      type: 'perfect_week',
      repeatable: true,
      current: 2,
      count: 2,
      unlockedAt: at('2026-10-04').toISOString(),
    });
    expect(byType.get('streak_4')).toMatchObject({ current: 2, threshold: 4 });
  });
});
