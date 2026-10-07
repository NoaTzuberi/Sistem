import { describe, it, expect } from 'vitest';
import { computeStreak, hasWeekEnded, perfectWeeks, workoutsNeeded } from '../streak';
import type { PlanWeek } from '../streak';

// The weekly plan completion streak (Phase 11 owner decisions). Today is Wednesday
// 2026-10-07, so the current week starts on Sunday 2026-10-04.
const TODAY = '2026-10-07';

function week(weekStartDate: string, planned: number, done: number): PlanWeek {
  return {
    weekStartDate,
    planned,
    done: Array.from({ length: done }, (_, index) => ({
      at: new Date(`${weekStartDate}T${String(10 + index).padStart(2, '0')}:00:00Z`),
      logId: `${weekStartDate}-${index}`,
    })),
  };
}

describe('workoutsNeeded', () => {
  it.each([
    [4, 1, 4],
    [4, 0.75, 3],
    [3, 0.75, 3], // 2 / 3 = 0.67 is below 0.75
    [2, 0.75, 2],
    [1, 0.75, 1],
    [10, 0.7, 7], // 0.7 × 10 is 7.000000000000001 in floating point
    [5, 0.1, 1], // never fewer than one
  ])('%i planned at ratio %d needs %i', (planned, ratio, needed) => {
    expect(workoutsNeeded(planned, ratio)).toBe(needed);
  });
});

describe('hasWeekEnded', () => {
  it('a week ends after its Saturday', () => {
    expect(hasWeekEnded('2026-09-27', '2026-10-03')).toBe(false);
    expect(hasWeekEnded('2026-09-27', '2026-10-04')).toBe(true);
  });
});

describe('computeStreak — ratio 1.0 (every workout)', () => {
  it('nothing planned: no streak', () => {
    expect(computeStreak([], TODAY, 1)).toEqual({ current: 0, best: 0, points: [] });
  });

  it('counts consecutive complete weeks; the unfinished current week does not break it', () => {
    const result = computeStreak([week('2026-09-20', 3, 3), week('2026-09-27', 2, 2), week('2026-10-04', 3, 1)], TODAY, 1);
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });

  it('the current week counts as soon as it is complete', () => {
    const result = computeStreak([week('2026-09-27', 2, 2), week('2026-10-04', 2, 2)], TODAY, 1);
    expect(result.current).toBe(2);
  });

  it('a week that ended with a workout not done breaks it', () => {
    const result = computeStreak(
      [week('2026-09-06', 2, 2), week('2026-09-13', 2, 2), week('2026-09-20', 3, 2), week('2026-09-27', 2, 2)],
      TODAY,
      1,
    );
    expect(result.current).toBe(1);
    expect(result.best).toBe(2);
  });

  it('weeks without a plan, or with an empty plan, are neutral', () => {
    // 09-13 and 09-27 have no plan at all; 09-20 has a plan with no workouts.
    const result = computeStreak([week('2026-09-06', 2, 2), week('2026-09-20', 0, 0), week('2026-10-04', 1, 1)], TODAY, 1);
    expect(result.current).toBe(2);
  });

  it('weeks after the current one are ignored', () => {
    const result = computeStreak([week('2026-09-27', 2, 2), week('2026-10-11', 2, 0)], TODAY, 1);
    expect(result.current).toBe(1);
  });

  it('each counting week is a point at the workout that completed it', () => {
    const { points } = computeStreak([week('2026-09-20', 2, 2), week('2026-09-27', 3, 3)], TODAY, 1);
    expect(points).toEqual([
      { weekStartDate: '2026-09-20', value: 1, logId: '2026-09-20-1', at: new Date('2026-09-20T11:00:00Z') },
      { weekStartDate: '2026-09-27', value: 2, logId: '2026-09-27-2', at: new Date('2026-09-27T12:00:00Z') },
    ]);
  });

  it('weeks may come in any order', () => {
    const result = computeStreak([week('2026-09-27', 1, 1), week('2026-09-13', 1, 1), week('2026-09-20', 1, 1)], TODAY, 1);
    expect(result.current).toBe(3);
  });
});

describe('computeStreak — ratio 0.75', () => {
  it('3 of 4 counts; 2 of 4 breaks', () => {
    const counts = computeStreak([week('2026-09-20', 4, 3), week('2026-09-27', 4, 3)], TODAY, 0.75);
    expect(counts.current).toBe(2);
    // The week counted at its 3rd workout, not the 4th.
    expect(counts.points[0].logId).toBe('2026-09-20-2');

    const breaks = computeStreak([week('2026-09-20', 4, 4), week('2026-09-27', 4, 2)], TODAY, 0.75);
    expect(breaks.current).toBe(0);
    expect(breaks.best).toBe(1);
  });

  it('the same 3 of 4 breaks the streak at ratio 1.0', () => {
    expect(computeStreak([week('2026-09-20', 4, 4), week('2026-09-27', 4, 3)], TODAY, 1).current).toBe(0);
  });
});

describe('perfectWeeks', () => {
  it('always needs every workout, whatever the streak ratio', () => {
    const weeks = [week('2026-09-20', 4, 3), week('2026-09-27', 2, 2), week('2026-10-04', 0, 0)];
    expect(perfectWeeks(weeks)).toEqual([
      { weekStartDate: '2026-09-27', logId: '2026-09-27-1', at: new Date('2026-09-27T11:00:00Z') },
    ]);
  });
});
