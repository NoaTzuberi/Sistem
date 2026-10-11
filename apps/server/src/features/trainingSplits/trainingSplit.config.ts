import type { PatternId, SplitConfig, TrainingSlot, WorkoutTypeConfig } from '@sistem/types';

// THE training config defaults (Phase 12b, PRD §8 v2): workout types with their exercise slots,
// and the weekly splits made of them. Per-coach overrides live in TrainingSettings and are merged
// by getEffectiveTrainingConfig(); her settings screen comes later (backlog). Labels of every id
// are in @sistem/shared copy (trainingCopy) — never here. The AI may only answer with these ids.

/** Days a week a plan never goes past: one rest day. */
export const MAX_TRAINING_DAYS = 6;
/** Default per slot: one main pick and one alternative / extra. */
export const DEFAULT_MAX_EXERCISES_PER_SLOT = 2;

function slot(id: string, patterns: PatternId[], required: boolean, maxExercises = DEFAULT_MAX_EXERCISES_PER_SLOT): TrainingSlot {
  return { id, patterns, required, maxExercises };
}

const LEGS_SLOTS: TrainingSlot[] = [
  slot('squat', ['squat'], true),
  slot('hinge', ['hinge'], true),
  slot('single_leg', ['lunge'], true),
  slot('glutes', ['glute_bridge', 'glute_isolation', 'hip_abduction'], true),
  slot('hamstrings', ['knee_flexion'], false),
  slot('quads', ['knee_extension'], false),
  slot('calves', ['calf_raise'], false),
];

export const DEFAULT_WORKOUT_TYPES: WorkoutTypeConfig[] = [
  {
    id: 'full_body',
    slots: [
      slot('legs_knee', ['squat', 'lunge'], true),
      slot('legs_hip', ['hinge', 'glute_bridge'], true),
      slot('chest', ['horizontal_push', 'chest_fly'], true),
      slot('back', ['horizontal_pull', 'vertical_pull'], true),
      slot('shoulders', ['vertical_push', 'shoulder_raise', 'rear_delt'], true),
      slot('core', ['core'], true),
      slot('finisher', ['conditioning', 'carry', 'power'], false),
    ],
  },
  {
    id: 'upper',
    slots: [
      slot('horizontal_push', ['horizontal_push'], true),
      slot('horizontal_pull', ['horizontal_pull'], true),
      slot('vertical_push', ['vertical_push'], true),
      slot('vertical_pull', ['vertical_pull'], true),
      slot('shoulder_isolation', ['shoulder_raise', 'rear_delt'], false),
      slot('biceps', ['elbow_flexion'], false),
      slot('triceps', ['elbow_extension'], false),
    ],
  },
  {
    id: 'lower',
    slots: [
      slot('squat', ['squat'], true),
      slot('hinge', ['hinge'], true),
      slot('single_leg', ['lunge'], false),
      slot('glutes', ['glute_bridge', 'glute_isolation', 'hip_abduction'], true),
      slot('hamstrings', ['knee_flexion'], true),
      slot('calves', ['calf_raise'], false),
      slot('core', ['core'], false),
    ],
  },
  {
    id: 'lower_glute',
    slots: [
      slot('glute_bridge', ['glute_bridge'], true),
      slot('hinge', ['hinge'], true),
      slot('single_leg', ['lunge'], true),
      slot('glute_isolation', ['glute_isolation'], true),
      slot('hip_abduction', ['hip_abduction'], false),
      slot('hamstrings', ['knee_flexion'], false),
    ],
  },
  {
    id: 'push',
    slots: [
      slot('chest_press', ['horizontal_push'], true),
      slot('shoulder_press', ['vertical_push'], true),
      slot('chest_fly', ['chest_fly'], false),
      slot('side_delts', ['shoulder_raise'], true),
      slot('triceps', ['elbow_extension'], true),
    ],
  },
  {
    id: 'pull',
    slots: [
      slot('vertical_pull', ['vertical_pull'], true),
      slot('horizontal_pull', ['horizontal_pull'], true),
      slot('rear_delts', ['rear_delt'], true),
      slot('biceps', ['elbow_flexion'], true),
      slot('traps', ['shrug'], false),
      slot('core', ['core'], false),
    ],
  },
  { id: 'legs', slots: LEGS_SLOTS },
  // ABC as the owner defined it for now (2026-10-09) — the coach confirms what ABC means to her
  // (docs/reference/abc-split-question.md).
  {
    id: 'abc_a',
    coachToConfirm: true,
    slots: [
      slot('horizontal_push', ['horizontal_push'], true),
      slot('horizontal_pull', ['horizontal_pull'], true),
      slot('vertical_pull', ['vertical_pull'], true),
      slot('chest_fly', ['chest_fly'], false),
      slot('core', ['core'], false),
    ],
  },
  { id: 'abc_b', coachToConfirm: true, slots: LEGS_SLOTS.map((legsSlot) => ({ ...legsSlot })) },
  {
    id: 'abc_c',
    coachToConfirm: true,
    slots: [
      slot('vertical_push', ['vertical_push'], true),
      slot('side_delts', ['shoulder_raise'], true),
      slot('rear_delts', ['rear_delt'], true),
      slot('biceps', ['elbow_flexion'], true),
      slot('triceps', ['elbow_extension'], true),
      slot('core', ['core'], false),
    ],
  },
];

const repeat = (types: string[], times: number) => Array.from({ length: times }, () => types).flat();

export const DEFAULT_SPLITS: SplitConfig[] = [
  {
    id: 'full_body',
    enabled: true,
    days: { 1: ['full_body'], 2: repeat(['full_body'], 2), 3: repeat(['full_body'], 3), 4: repeat(['full_body'], 4) },
  },
  { id: 'upper_lower', enabled: true, days: { 2: ['upper', 'lower'], 4: repeat(['upper', 'lower'], 2) } },
  { id: 'upper_lower_full', enabled: true, days: { 3: ['upper', 'lower', 'full_body'] } },
  {
    id: 'upper_lower_glute',
    enabled: true,
    days: { 3: ['lower', 'upper', 'lower_glute'], 4: ['upper', 'lower', 'upper', 'lower_glute'] },
  },
  { id: 'ppl', enabled: true, days: { 3: ['push', 'pull', 'legs'], 6: repeat(['push', 'pull', 'legs'], 2) } },
  { id: 'ppl_upper_lower', enabled: true, days: { 5: ['push', 'pull', 'legs', 'upper', 'lower'] } },
  {
    id: 'abc',
    enabled: true,
    coachToConfirm: true,
    days: { 3: ['abc_a', 'abc_b', 'abc_c'], 6: repeat(['abc_a', 'abc_b', 'abc_c'], 2) },
  },
  {
    id: 'abc_glute',
    enabled: true,
    coachToConfirm: true,
    days: { 3: ['abc_a', 'lower_glute', 'abc_c'], 6: ['abc_a', 'abc_b', 'abc_c', 'abc_a', 'lower_glute', 'abc_c'] },
  },
];
