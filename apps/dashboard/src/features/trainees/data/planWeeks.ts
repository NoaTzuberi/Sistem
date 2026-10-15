import type { CoachPlan, Language, PlanWeekOption } from '@sistem/types';
import { fill, formatPlural, sharedCopy, splitLabel } from '@sistem/shared';
import { traineesCopy } from '../copy';

const DAY_MS = 24 * 60 * 60 * 1000;
/** The "new plan" popover offers this week and the next three. */
export const NEW_PLAN_WEEK_COUNT = 4;

/** "3 workouts · 20 exercises". */
export function describePlanSize(plan: CoachPlan, language: Language): string {
  const exercises = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
  return fill(traineesCopy[language].planSize, { workouts: plan.workouts.length, exercises });
}

/** What a plan is called: its split when it follows one — plans have no title of their own. */
export function planName(plan: CoachPlan, language: Language): string | undefined {
  return plan.splitId ? splitLabel(plan.splitId, language) : undefined;
}

/** "This week" / "Next week" / "In 2 weeks" for a week the popover offers. */
export function weekTileLabel(week: PlanWeekOption, currentWeekStart: string, language: Language): string {
  if (week.relation !== 'later') return sharedCopy[language].weekRelation[week.relation];
  const weeksAhead = Math.round((Date.parse(`${week.weekStartDate}T00:00:00Z`) - Date.parse(`${currentWeekStart}T00:00:00Z`)) / (7 * DAY_MS));
  return formatPlural(language, traineesCopy[language].inWeeks, weeksAhead);
}
