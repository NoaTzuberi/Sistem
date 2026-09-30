import type { ComponentType } from 'react';
import type { BadgeVariant } from '../../../components/common/Badge/Badge';
import type { Difficulty } from '../../exercises/types';
import type { WorkoutCategory, WorkoutGoal } from '../types';
import { StrengthGoalIcon, HypertrophyGoalIcon, EnduranceGoalIcon } from '../components/icons';

export const WORKOUT_CATEGORY_OPTIONS: { value: WorkoutCategory; label: string }[] = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'upper_body', label: 'Upper Body' },
  { value: 'legs', label: 'Lower Body' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'core', label: 'Core' },
];

export const WORKOUT_GOAL_OPTIONS: { value: WorkoutGoal; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'endurance', label: 'Endurance' },
];

const CATEGORY_LABELS = new Map(WORKOUT_CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const GOAL_LABELS = new Map(WORKOUT_GOAL_OPTIONS.map((option) => [option.value, option.label]));

export function workoutCategoryLabel(value: string): string {
  return CATEGORY_LABELS.get(value as WorkoutCategory) ?? value;
}

export function workoutGoalLabel(value: string): string {
  return GOAL_LABELS.get(value as WorkoutGoal) ?? value;
}

const GOAL_ICONS: Record<WorkoutGoal, ComponentType> = {
  strength: StrengthGoalIcon,
  hypertrophy: HypertrophyGoalIcon,
  endurance: EnduranceGoalIcon,
};

export function workoutGoalIcon(value: WorkoutGoal): ComponentType {
  return GOAL_ICONS[value];
}

export type WorkoutGoalAccent = 'orange' | 'plum' | 'blue';

/** Strength keeps the app's primary orange; Hypertrophy and Endurance get
 * their own hue so the three goals read as distinct identities at a glance,
 * matching the accent-per-card pattern already used on the Profile page. */
const GOAL_ACCENTS: Record<WorkoutGoal, WorkoutGoalAccent> = {
  strength: 'orange',
  hypertrophy: 'plum',
  endurance: 'blue',
};

export function workoutGoalAccent(value: WorkoutGoal): WorkoutGoalAccent {
  return GOAL_ACCENTS[value];
}

const DIFFICULTY_BADGE_VARIANTS: Record<Difficulty, BadgeVariant> = {
  beginner: 'success',
  intermediate: 'achievement',
  advanced: 'danger',
};

export function difficultyBadgeVariant(difficulty: Difficulty): BadgeVariant {
  return DIFFICULTY_BADGE_VARIANTS[difficulty] ?? 'default';
}
