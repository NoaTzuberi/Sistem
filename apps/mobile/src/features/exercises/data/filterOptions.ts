import type { ComponentType } from 'react';
import {
  BarbellIcon,
  DumbbellIcon,
  CableIcon,
  MachineIcon,
  KettlebellIcon,
  ResistanceBandIcon,
  BodyweightIcon,
  EzCurlBarIcon,
  ExerciseBallIcon,
  FoamRollerIcon,
  MedicineBallIcon,
  NoEquipmentIcon,
  OtherEquipmentIcon,
  BattleRopeIcon,
  PullUpBarIcon,
  SignalOneIcon,
  SignalTwoIcon,
  SignalThreeIcon,
  StrengthIcon,
  MobilityIcon,
  CardioIcon,
} from '../components/icons';
import type { Difficulty, MovementType } from '../types';

export interface FilterOption {
  value: string;
  label: string;
}

/** Mirrors apps/server/src/features/exercises/exercise.constants.ts MUSCLE_IDS. */
export const MUSCLE_OPTIONS: FilterOption[] = [
  { value: 'abdominals', label: 'Abdominals' },
  { value: 'abductors', label: 'Abductors' },
  { value: 'adductors', label: 'Adductors' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'calves', label: 'Calves' },
  { value: 'chest', label: 'Chest' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'lats', label: 'Lats' },
  { value: 'lower_back', label: 'Lower Back' },
  { value: 'middle_back', label: 'Middle Back' },
  { value: 'neck', label: 'Neck' },
  { value: 'quadriceps', label: 'Quadriceps' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'traps', label: 'Traps' },
  { value: 'triceps', label: 'Triceps' },
];

/** Mirrors apps/server/src/features/exercises/exercise.constants.ts EQUIPMENT_IDS. */
export const EQUIPMENT_OPTIONS: FilterOption[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_band', label: 'Resistance Band' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'ez_curl_bar', label: 'EZ Curl Bar' },
  { value: 'exercise_ball', label: 'Exercise Ball' },
  { value: 'foam_roller', label: 'Foam Roller' },
  { value: 'medicine_ball', label: 'Medicine Ball' },
  { value: 'no_equipment', label: 'No Equipment' },
  { value: 'other', label: 'Other' },
  { value: 'battle_rope', label: 'Battle Rope' },
  { value: 'pull_up_bar', label: 'Pull-Up Bar' },
];

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const MOVEMENT_TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'cardio', label: 'Cardio' },
];

const MUSCLE_LABELS = new Map(MUSCLE_OPTIONS.map((option) => [option.value, option.label]));
const EQUIPMENT_LABELS = new Map(EQUIPMENT_OPTIONS.map((option) => [option.value, option.label]));

export function muscleLabel(value: string): string {
  return MUSCLE_LABELS.get(value) ?? value;
}

export function equipmentLabel(value: string): string {
  return EQUIPMENT_LABELS.get(value) ?? value;
}

const EQUIPMENT_ICONS: Record<string, ComponentType> = {
  barbell: BarbellIcon,
  dumbbell: DumbbellIcon,
  cable: CableIcon,
  machine: MachineIcon,
  kettlebell: KettlebellIcon,
  resistance_band: ResistanceBandIcon,
  bodyweight: BodyweightIcon,
  ez_curl_bar: EzCurlBarIcon,
  exercise_ball: ExerciseBallIcon,
  foam_roller: FoamRollerIcon,
  medicine_ball: MedicineBallIcon,
  no_equipment: NoEquipmentIcon,
  other: OtherEquipmentIcon,
  battle_rope: BattleRopeIcon,
  pull_up_bar: PullUpBarIcon,
};

export function equipmentIcon(value: string): ComponentType | undefined {
  return EQUIPMENT_ICONS[value];
}

const DIFFICULTY_ICONS: Record<Difficulty, ComponentType> = {
  beginner: SignalOneIcon,
  intermediate: SignalTwoIcon,
  advanced: SignalThreeIcon,
};

export function difficultyIcon(value: Difficulty): ComponentType {
  return DIFFICULTY_ICONS[value];
}

const MOVEMENT_TYPE_ICONS: Record<MovementType, ComponentType> = {
  strength: StrengthIcon,
  mobility: MobilityIcon,
  cardio: CardioIcon,
};

export function movementTypeIcon(value: MovementType): ComponentType {
  return MOVEMENT_TYPE_ICONS[value];
}

/** Muted editorial hue per muscle, reusing the exact 4-color mapping already
 * established for workout categories (upper_body=blue, core=plum,
 * lower_body=olive) — "back" gets teal, matching how Pull work uses teal
 * there. Keeps muscle tags visually consistent with Workouts/Profile instead
 * of introducing a new palette. */
const MUSCLE_TAG_HUE: Record<string, 'upper_body' | 'back' | 'core' | 'lower_body'> = {
  chest: 'upper_body',
  shoulders: 'upper_body',
  triceps: 'upper_body',
  biceps: 'upper_body',
  forearms: 'upper_body',
  traps: 'upper_body',
  neck: 'upper_body',
  lats: 'back',
  middle_back: 'back',
  lower_back: 'back',
  abdominals: 'core',
  quadriceps: 'lower_body',
  hamstrings: 'lower_body',
  calves: 'lower_body',
  glutes: 'lower_body',
  abductors: 'lower_body',
  adductors: 'lower_body',
};

export function muscleTagHue(value: string): 'upper_body' | 'back' | 'core' | 'lower_body' {
  return MUSCLE_TAG_HUE[value] ?? 'upper_body';
}
