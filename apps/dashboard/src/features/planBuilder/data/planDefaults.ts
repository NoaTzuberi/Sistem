import type { SetType } from '@sistem/types';

// What a newly added exercise starts with (owner decision): 3 × 10, no weight, no rest.
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 10;

/** Drafts are saved on their own this long after the last change. */
export const AUTOSAVE_DELAY_MS = 2500;

export const SUPERSET_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

// 0 = Sunday — weeks start on Sunday (owner decision).
export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const SET_TYPE_OPTIONS: { id: SetType; label: string }[] = [
  { id: 'warmup', label: 'Warm-up' },
  { id: 'working', label: 'Working' },
  { id: 'drop', label: 'Drop' },
];
