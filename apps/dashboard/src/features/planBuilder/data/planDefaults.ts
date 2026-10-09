import type { SetType } from '@sistem/types';

// What a newly added exercise starts with (owner decision): 3 × 10, no weight, no rest.
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 10;

/** Drafts are saved on their own this long after the last change. */
export const AUTOSAVE_DELAY_MS = 2500;

export const SUPERSET_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

// The set types in picker order; their labels are in the shared copy (plan.setTypes). Day names
// come from Intl (dayNames) — 0 = Sunday, weeks start on Sunday (owner decision).
export const SET_TYPE_IDS: SetType[] = ['warmup', 'working', 'drop'];
