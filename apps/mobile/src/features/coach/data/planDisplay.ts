import type { PlanIssue } from '@sistem/types';

// Read-only wording for a plan. Placeholder formats — the owner decides the final ones.

/** 'Workout 2, exercise 1: …' — where the server says a refused plan is wrong. */
export function describeIssue(issue: PlanIssue): string {
  const where = [
    ...(issue.workoutIndex !== undefined ? [`Workout ${issue.workoutIndex + 1}`] : []),
    ...(issue.exerciseIndex !== undefined ? [`exercise ${issue.exerciseIndex + 1}`] : []),
  ].join(', ');
  return where ? `${where}: ${issue.message}` : issue.message;
}
