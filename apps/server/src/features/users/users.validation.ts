import {
  GOAL_IDS,
  ACTIVITY_IDS,
  EQUIPMENT_IDS,
  MUSCLE_FOCUS_IDS,
  RECOVERY_FLAG_IDS,
  GENDER_IDS,
} from './users.constants';

const MIN_AGE = 5;
const MAX_AGE = 120;
const MIN_HEIGHT_CM = 50;
const MAX_HEIGHT_CM = 300;
const MIN_WEIGHT = 20;
const MAX_WEIGHT = 400;

function isStringArrayWithinSet(value: unknown, allowed: readonly string[]): boolean {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string' && allowed.includes(item))
  );
}

function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isValidBirthDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const ageMs = Date.now() - date.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears >= MIN_AGE && ageYears <= MAX_AGE;
}

export function validateOnboardingPayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid request body.';
  }

  const payload = body as Record<string, unknown>;

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
      return 'Name must be a non-empty string.';
    }
  }

  if (!isValidBirthDate(payload.birthDate)) {
    return `Birth date must indicate an age between ${MIN_AGE} and ${MAX_AGE}.`;
  }

  if (!isNumberInRange(payload.height, MIN_HEIGHT_CM, MAX_HEIGHT_CM)) {
    return `Height must be a number between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM}.`;
  }

  if (!isNumberInRange(payload.weight, MIN_WEIGHT, MAX_WEIGHT)) {
    return `Weight must be a number between ${MIN_WEIGHT} and ${MAX_WEIGHT}.`;
  }

  if (
    payload.gender !== undefined &&
    payload.gender !== '' &&
    !(GENDER_IDS as readonly string[]).includes(payload.gender as string)
  ) {
    return 'Gender must be one of the valid options.';
  }

  const units = payload.units as Record<string, unknown> | undefined;
  if (typeof units !== 'object' || units === null) {
    return 'Units preference is required.';
  }
  if (units.weight !== 'kg' && units.weight !== 'lb') {
    return "Weight unit must be 'kg' or 'lb'.";
  }
  if (units.distance !== 'km' && units.distance !== 'miles') {
    return "Distance unit must be 'km' or 'miles'.";
  }

  if (!isStringArrayWithinSet(payload.goals, GOAL_IDS) || (payload.goals as unknown[]).length === 0) {
    return 'Goals must include at least one valid goal.';
  }

  const trainingFrequency = payload.trainingFrequency as Record<string, unknown> | undefined;
  if (typeof trainingFrequency !== 'object' || trainingFrequency === null) {
    return 'Training frequency is required.';
  }
  if (!isNumberInRange(trainingFrequency.minDays, 1, 7)) {
    return 'Minimum training days must be between 1 and 7.';
  }
  if (!isNumberInRange(trainingFrequency.maxDays, 1, 7)) {
    return 'Maximum training days must be between 1 and 7.';
  }
  if ((trainingFrequency.minDays as number) > (trainingFrequency.maxDays as number)) {
    return 'Minimum training days cannot exceed maximum training days.';
  }
  if (typeof trainingFrequency.flexibleSchedule !== 'boolean') {
    return 'Flexible schedule must be true or false.';
  }

  if (
    !isStringArrayWithinSet(payload.preferredActivities, ACTIVITY_IDS) ||
    (payload.preferredActivities as unknown[]).length === 0
  ) {
    return 'Preferred activities must include at least one valid activity.';
  }

  const exercisePreferences = payload.exercisePreferences as Record<string, unknown> | undefined;
  if (exercisePreferences !== undefined) {
    if (typeof exercisePreferences !== 'object' || exercisePreferences === null) {
      return 'Exercise preferences must be an object.';
    }
    if (
      exercisePreferences.favoriteExerciseNotes !== undefined &&
      typeof exercisePreferences.favoriteExerciseNotes !== 'string'
    ) {
      return 'Favorite exercise notes must be a string.';
    }
    if (
      exercisePreferences.improvementExerciseNotes !== undefined &&
      typeof exercisePreferences.improvementExerciseNotes !== 'string'
    ) {
      return 'Improvement exercise notes must be a string.';
    }
    if (
      exercisePreferences.muscleFocus !== undefined &&
      !isStringArrayWithinSet(exercisePreferences.muscleFocus, MUSCLE_FOCUS_IDS)
    ) {
      return 'Muscle focus contains an invalid value.';
    }
  }

  if (!isStringArrayWithinSet(payload.equipment, EQUIPMENT_IDS) || (payload.equipment as unknown[]).length === 0) {
    return 'Equipment must include at least one valid option.';
  }

  const recovery = payload.recovery as Record<string, unknown> | undefined;
  if (recovery !== undefined) {
    if (typeof recovery !== 'object' || recovery === null) {
      return 'Recovery must be an object.';
    }
    if (recovery.flags !== undefined && !isStringArrayWithinSet(recovery.flags, RECOVERY_FLAG_IDS)) {
      return 'Recovery flags contain an invalid value.';
    }
    if (recovery.notes !== undefined && typeof recovery.notes !== 'string') {
      return 'Recovery notes must be a string.';
    }
  }

  return null;
}
