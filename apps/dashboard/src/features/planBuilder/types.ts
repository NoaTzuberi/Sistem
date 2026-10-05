import type { ExerciseFacts, SetType } from '@sistem/types';

// The plan as it is being edited. Every item has a client `key` (stable across
// renders, drags and saves); `id` appears once the server has stored the item.

export interface DraftTargets {
  reps?: number;
  repsMax?: number;
  durationSec?: number;
  targetWeight?: number;
  restSec?: number;
}

export interface DraftSetTarget extends DraftTargets {
  key: string;
  type: SetType;
}

/** Whether the simple (same for every set) row counts reps or seconds. */
export type TargetMode = 'reps' | 'time';

export interface DraftExercise extends DraftTargets {
  key: string;
  id?: string;
  exerciseId: string;
  facts?: ExerciseFacts;
  mode: TargetMode;
  sets?: number;
  notes: string;
  /** '' = not in a superset */
  supersetGroup: string;
  /** null = simple mode; a list = one row per set (pyramids, warm-ups, drop sets). */
  setTargets: DraftSetTarget[] | null;
  /** Interval mode (HIIT / Tabata) — timed sets only; a superset is all interval or none. */
  interval: boolean;
}

export interface DraftWorkout {
  key: string;
  id?: string;
  title: string;
  dayOfWeek?: number;
  notes: string;
  exercises: DraftExercise[];
}

export interface PlanDraft {
  notes: string;
  workouts: DraftWorkout[];
}

/** The keys of a draft in payload order — to match a save response back to it. */
export type DraftKeys = { key: string; exercises: string[] }[];
