import { useCallback, useState } from 'react';
import type { CoachMealLogWeek, MealLogDay, PortionCounts, PortionGroup } from '@sistem/types';
import { addDaysToDate, getActiveLanguage, PORTION_GROUPS, useLoad } from '@sistem/shared';
import { getTraineeMealLogs } from '../../../services/coach/coachService';
import { nutritionCopy } from '../copy';

export type DayState = 'today' | 'marked' | 'not_marked' | 'no_plan' | 'future';

export interface TrackedDay {
  day: MealLogDay;
  state: DayState;
  isToday: boolean;
  /** Portions marked / planned over the groups. */
  eaten: number;
  planned: number;
  /** Something to open: marks or meal photos. */
  hasDetails: boolean;
}

const sum = (counts: PortionCounts) => PORTION_GROUPS.reduce((total, group) => total + counts[group], 0);

function stateOf(day: MealLogDay, today: string): DayState {
  if (day.date > today) return 'future';
  if (day.planVersion === null || sum(day.planned) === 0) return 'no_plan';
  if (day.date === today) return 'today';
  return day.logged ? 'marked' : 'not_marked';
}

/**
 * Her portion tracking, one Sunday week at a time (read-only, the server's week): the days with
 * their state, the week's totals, and the daily goal per group (the plan live on the latest day
 * that has one). Neutral — counts only, never a score or calories.
 */
export function usePortionTracking(traineeId: string) {
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const load = useCallback(() => getTraineeMealLogs(traineeId, weekStart ?? undefined), [traineeId, weekStart]);
  const { data, error, isLoading, reload } = useLoad<CoachMealLogWeek>(load, nutritionCopy[getActiveLanguage()].trackingLoadError);

  const days: TrackedDay[] =
    data?.days.map((day) => ({
      day,
      state: stateOf(day, data.today),
      isToday: day.date === data.today,
      eaten: sum(day.eaten),
      planned: sum(day.planned),
      hasDetails: day.date <= data.today && (day.logged || day.photos.length > 0),
    })) ?? [];
  const latestPlanned = [...days].reverse().find((entry) => entry.planned > 0)?.day.planned ?? null;
  const dailyGoal: Partial<Record<PortionGroup, number>> = latestPlanned ?? {};

  return {
    data,
    error,
    isLoading,
    reload,
    days,
    dailyGoal,
    isCurrentWeek: data ? data.today <= addDaysToDate(data.weekStart, 6) : true,
    previous: () => data && setWeekStart(addDaysToDate(data.weekStart, -7)),
    next: () => data && setWeekStart(addDaysToDate(data.weekStart, 7)),
  };
}
