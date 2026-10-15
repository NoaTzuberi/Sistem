import { useMemo } from 'react';
import type { CoachPlan, CoachPlanProgress } from '@sistem/types';
import { addDaysToDate } from '@sistem/shared';

export type WeekTime = 'past' | 'current' | 'future';

export interface ProgramWeek {
  /** 'YYYY-MM-DD' Sunday (her zone). */
  weekStartDate: string;
  /** Week N of her program (1 = the week of her first plan). */
  number: number;
  time: WeekTime;
  plan: CoachPlan | undefined;
  /** published · draft · no plan. */
  status: 'published' | 'draft' | 'empty';
  /** A published plan's workout statuses (the server's). */
  progress: CoachPlanProgress | undefined;
  /** 0–1, published plans only. */
  completion: number | null;
}

/**
 * Her program as weeks: from the week of her first plan to the last planned week (or this week),
 * plus one empty week after it to prepare — every week once, plans or not.
 */
export function useTraineeWeeks(plans: CoachPlan[] | undefined, currentWeekStart: string): ProgramWeek[] {
  return useMemo(() => {
    if (!plans || plans.length === 0) return [];
    const byWeek = new Map(plans.map((plan) => [plan.weekStartDate, plan]));
    const starts = plans.map((plan) => plan.weekStartDate).sort();
    const first = starts[0] < currentWeekStart ? starts[0] : currentWeekStart;
    const lastPlanned = starts[starts.length - 1] > currentWeekStart ? starts[starts.length - 1] : currentWeekStart;
    const lastWeek = addDaysToDate(lastPlanned, 7);

    const weeks: ProgramWeek[] = [];
    for (let week = first, number = 1; week <= lastWeek; week = addDaysToDate(week, 7), number += 1) {
      const plan = byWeek.get(week);
      const progress = plan?.status === 'published' ? plan.progress : undefined;
      weeks.push({
        weekStartDate: week,
        number,
        time: week < currentWeekStart ? 'past' : week === currentWeekStart ? 'current' : 'future',
        plan,
        status: plan ? plan.status : 'empty',
        progress,
        completion: progress && progress.planned > 0 ? progress.completed / progress.planned : null,
      });
    }
    return weeks;
  }, [plans, currentWeekStart]);
}
