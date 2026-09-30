import type { ComponentType } from 'react';
import { UpperBodyIcon, LowerBodyIcon, CoreIcon, PullIcon } from '../icons';
import type { Category } from '../../../exercises/types';

/** Exercise-level categories (from the exercise model, not the workout-template
 * category taxonomy — those are two different fields). "Back" reuses the pull
 * icon since back training is overwhelmingly pull-pattern work. */
export const EXERCISE_CATEGORY_OPTIONS: { value: Category; label: string; Icon: ComponentType }[] = [
  { value: 'upper_body', label: 'Upper Body', Icon: UpperBodyIcon },
  { value: 'back', label: 'Back', Icon: PullIcon },
  { value: 'core', label: 'Core', Icon: CoreIcon },
  { value: 'lower_body', label: 'Lower Body', Icon: LowerBodyIcon },
];
