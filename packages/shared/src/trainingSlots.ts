import type { PatternId, TrainingSlot, WorkoutTypeConfig } from '@sistem/types';

// Pure slot logic for the plan builder (Phase 12b). The server checks the ids on save; these
// helpers only arrange what the coach sees and keep exercises in sensible slots when she changes
// a workout's type. They never decide whether a plan is valid.

export interface SlotExercise {
  slotId?: string;
  /** The exercise family's movement patterns (from the exercise facts). */
  patterns?: readonly PatternId[];
}

export function slotFits(slot: TrainingSlot, patterns: readonly PatternId[] | undefined): boolean {
  return Boolean(patterns?.some((pattern) => slot.patterns.includes(pattern)));
}

/**
 * New slot ids for the exercises of a workout whose type changes. An exercise keeps a slot with
 * the same id that still fits it; the rest go to the first slot that fits and has room (required
 * slots first); what doesn't fit anywhere goes to "Other" (undefined). No type = all Other.
 */
export function rematchSlots(exercises: readonly SlotExercise[], type: WorkoutTypeConfig | undefined): (string | undefined)[] {
  if (!type) return exercises.map(() => undefined);
  const used = new Map<string, number>();
  const room = (slot: TrainingSlot) => (used.get(slot.id) ?? 0) < slot.maxExercises;
  const take = (slot: TrainingSlot) => {
    used.set(slot.id, (used.get(slot.id) ?? 0) + 1);
    return slot.id;
  };
  const result: (string | undefined)[] = exercises.map(() => undefined);

  exercises.forEach((exercise, index) => {
    const same = type.slots.find((slot) => slot.id === exercise.slotId);
    if (same && slotFits(same, exercise.patterns) && room(same)) result[index] = take(same);
  });
  const ordered = [...type.slots.filter((slot) => slot.required), ...type.slots.filter((slot) => !slot.required)];
  exercises.forEach((exercise, index) => {
    if (result[index]) return;
    const slot = ordered.find((candidate) => slotFits(candidate, exercise.patterns) && room(candidate));
    if (slot) result[index] = take(slot);
  });
  return result;
}

export interface SlotSection {
  slot: TrainingSlot;
  /** Indexes of the workout's exercises in this slot, in workout order. */
  exerciseIndexes: number[];
}

/** The workout's exercises by slot (the type's slot order) + the ones in no slot of it ("Other"). */
export function groupBySlot(exercises: readonly SlotExercise[], type: WorkoutTypeConfig): { sections: SlotSection[]; other: number[] } {
  const sections = type.slots.map((slot) => ({ slot, exerciseIndexes: [] as number[] }));
  const other: number[] = [];
  exercises.forEach((exercise, index) => {
    const section = sections.find((entry) => entry.slot.id === exercise.slotId);
    if (section) section.exerciseIndexes.push(index);
    else other.push(index);
  });
  return { sections, other };
}

/** Required slots with no exercise yet (a display hint — the server's publish rules decide). */
export function emptyRequiredSlots(exercises: readonly SlotExercise[], type: WorkoutTypeConfig | undefined): TrainingSlot[] {
  if (!type) return [];
  return type.slots.filter((slot) => slot.required && !exercises.some((exercise) => exercise.slotId === slot.id));
}
