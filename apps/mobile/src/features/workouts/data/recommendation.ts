import type { WorkoutGoal, WorkoutTemplate, WorkoutSummary, WorkoutCategory } from '../types';
import { workoutCategoryLabel } from './workoutOptions';

/** Only onboarding goals with a clean semantic match to a workout-template goal get
 * personalized here — others (improve_health, move_better, etc.) fall through to the
 * "recently added" placeholder rather than forcing a weak/confusing match. */
const GOAL_MATCH: Partial<Record<string, { workoutGoal: WorkoutGoal; phrase: string }>> = {
  build_muscle: { workoutGoal: 'hypertrophy', phrase: 'muscle-building goal' },
  increase_strength: { workoutGoal: 'strength', phrase: 'strength goal' },
  lose_weight: { workoutGoal: 'endurance', phrase: 'fat-loss goal' },
  improve_endurance: { workoutGoal: 'endurance', phrase: 'endurance goal' },
};

export interface RecommendedWorkout {
  template: WorkoutTemplate;
  reason?: string;
  isPersonalized: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The categories used for weekly training-balance gap detection. upper_body/full_body
 * are broad umbrella categories that already overlap push/pull/legs work, so they're
 * excluded here to keep "what's missing" unambiguous. */
const BALANCE_CATEGORIES: WorkoutCategory[] = ['push', 'pull', 'legs', 'core'];

/** Antagonist pairs checked before falling back to "just find anything untrained" —
 * training one side of a pair without the other is the clearest, most actionable gap. */
const ANTAGONISTS: Partial<Record<WorkoutCategory, WorkoutCategory>> = {
  push: 'pull',
  pull: 'push',
};

/** Deterministic order for picking among multiple equally-untrained categories. */
const GAP_PRIORITY: WorkoutCategory[] = ['pull', 'push', 'legs', 'core'];

interface WeeklyGap {
  category: WorkoutCategory;
  reason: string;
}

/** Looks at completed sessions from the last 7 days (the same rolling window the
 * Dashboard's "This Week" tracker uses) and finds the clearest missing category:
 * an antagonist gap (trained push but not pull, or vice versa) wins first, then any
 * balance category with zero sessions this week. Returns null when there's no
 * session data yet or every balance category has already been trained. */
function findWeeklyGap(thisWeekSessions: WorkoutSummary[]): WeeklyGap | null {
  const counts: Partial<Record<WorkoutCategory, number>> = {};
  for (const category of BALANCE_CATEGORIES) counts[category] = 0;

  for (const session of thisWeekSessions) {
    const category = session.category;
    if (category && counts[category] !== undefined) {
      counts[category] += 1;
    }
  }

  const trainedTotal = BALANCE_CATEGORIES.reduce((sum, category) => sum + (counts[category] ?? 0), 0);
  if (trainedTotal === 0) return null;

  for (const [trained, antagonist] of Object.entries(ANTAGONISTS) as [WorkoutCategory, WorkoutCategory][]) {
    const trainedCount = counts[trained] ?? 0;
    if (trainedCount > 0 && counts[antagonist] === 0) {
      const times = trainedCount === 1 ? 'once' : `${trainedCount} times`;
      return {
        category: antagonist,
        reason: `You've trained ${workoutCategoryLabel(trained)} ${times} this week — balance it out with ${workoutCategoryLabel(antagonist)}.`,
      };
    }
  }

  const untouched = GAP_PRIORITY.find((category) => counts[category] === 0);
  if (untouched) {
    return { category: untouched, reason: `No ${workoutCategoryLabel(untouched)} days yet this week.` };
  }

  return null;
}

/** Picks a featured workout from system templates only — a user's own creations are
 * never suggested back to them. Prefers a template that fills a gap in what the user
 * has actually trained this week; falls back to their stated onboarding goal when
 * there's no clear gap yet (early in the week, nothing logged, or already balanced);
 * falls back further to the most recently added system template otherwise. */
export function getRecommendedTemplate(
  templates: WorkoutTemplate[],
  onboardingGoals: string[] | undefined,
  recentSessions: WorkoutSummary[] = [],
): RecommendedWorkout | null {
  const systemTemplates = templates.filter((template) => template.isSystemTemplate);
  if (systemTemplates.length === 0) return null;

  const sevenDaysAgo = Date.now() - 7 * MS_PER_DAY;
  const thisWeekSessions = recentSessions.filter((session) => new Date(session.date).getTime() >= sevenDaysAgo);

  const gap = findWeeklyGap(thisWeekSessions);
  if (gap) {
    const template = systemTemplates.find((t) => t.category === gap.category);
    if (template) {
      return { template, reason: gap.reason, isPersonalized: true };
    }
  }

  for (const goalId of onboardingGoals ?? []) {
    const match = GOAL_MATCH[goalId];
    if (!match) continue;
    const template = systemTemplates.find((t) => t.goal.includes(match.workoutGoal));
    if (template) {
      return { template, reason: `Matches your ${match.phrase}`, isPersonalized: true };
    }
  }

  const mostRecent = [...systemTemplates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  return { template: mostRecent, isPersonalized: false };
}
