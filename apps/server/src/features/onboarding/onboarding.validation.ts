import type { OnboardingStepId, WeightUnit } from '@sistem/types';
import { KG_PER_LB, lbToKg } from '../users/units';
import {
  GOAL_IDS,
  ACTIVITY_IDS,
  EQUIPMENT_IDS,
  MUSCLE_FOCUS_IDS,
  RECOVERY_FLAG_IDS,
  GENDER_IDS,
} from '../users/users.constants';
import { ALLERGY_IDS, DIET_TYPE_IDS, MAX_PREFERENCE_TEXT_LENGTH } from '../nutrition/nutrition.constants';
import {
  ONBOARDING_FIELDS,
  ONBOARDING_STEP_FIELDS,
  ONBOARDING_STEP_IDS,
  REQUIRED_ON_COMPLETE,
} from './onboarding.constants';
import type { OnboardingField } from './onboarding.constants';

// Moved from users.validation.ts (Phase 3) and split per field, so a single step and
// the final submit share the same rules and messages.

const MIN_AGE = 5;
const MAX_AGE = 120;
const MIN_HEIGHT_CM = 50;
const MAX_HEIGHT_CM = 300;
// The weight is typed in her unit; the limits apply to the kg value it is stored as
// (Phase 10), so in lb they are about 44–882. Height is always typed in cm.
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 400;

interface ValidationContext {
  /** The unit the weight was typed in. */
  weightUnit: WeightUnit;
}

type FieldValidator = (value: unknown, context: ValidationContext) => string | null;

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function weightRangeMessage(unit: WeightUnit): string {
  if (unit === 'kg') return `Weight must be a number between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG}.`;
  return `Weight must be a number between ${roundOneDecimal(MIN_WEIGHT_KG / KG_PER_LB)} and ${roundOneDecimal(MAX_WEIGHT_KG / KG_PER_LB)} lb.`;
}

function isWeightUnit(value: unknown): value is WeightUnit {
  return value === 'kg' || value === 'lb';
}

/** The unit sent with the answers (same step), else the one she chose before. */
function resolveWeightUnit(answers: Record<string, unknown>, storedUnit: WeightUnit): WeightUnit {
  const units = answers.units;
  return isObject(units) && isWeightUnit(units.weight) ? units.weight : storedUnit;
}

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const FIELD_VALIDATORS: Record<OnboardingField, FieldValidator> = {
  name(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Name must be a non-empty string.';
    }
    return null;
  },

  birthDate(value) {
    return isValidBirthDate(value) ? null : `Birth date must indicate an age between ${MIN_AGE} and ${MAX_AGE}.`;
  },

  height(value) {
    return isNumberInRange(value, MIN_HEIGHT_CM, MAX_HEIGHT_CM)
      ? null
      : `Height must be a number between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM}.`;
  },

  weight(value, { weightUnit }) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return weightRangeMessage(weightUnit);
    // Converted the same way the service stores it, so the limits match what is saved.
    const kg = weightUnit === 'lb' ? lbToKg(value) : value;
    return kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG ? null : weightRangeMessage(weightUnit);
  },

  gender(value) {
    if (value !== '' && !(GENDER_IDS as readonly string[]).includes(value as string)) {
      return 'Gender must be one of the valid options.';
    }
    return null;
  },

  units(value) {
    if (!isObject(value)) return 'Units preference is required.';
    if (value.weight !== 'kg' && value.weight !== 'lb') return "Weight unit must be 'kg' or 'lb'.";
    if (value.distance !== 'km' && value.distance !== 'miles') return "Distance unit must be 'km' or 'miles'.";
    return null;
  },

  goals(value) {
    if (!isStringArrayWithinSet(value, GOAL_IDS) || (value as unknown[]).length === 0) {
      return 'Goals must include at least one valid goal.';
    }
    return null;
  },

  trainingFrequency(value) {
    if (!isObject(value)) return 'Training frequency is required.';
    if (!isNumberInRange(value.minDays, 1, 7)) return 'Minimum training days must be between 1 and 7.';
    if (!isNumberInRange(value.maxDays, 1, 7)) return 'Maximum training days must be between 1 and 7.';
    if ((value.minDays as number) > (value.maxDays as number)) {
      return 'Minimum training days cannot exceed maximum training days.';
    }
    if (typeof value.flexibleSchedule !== 'boolean') return 'Flexible schedule must be true or false.';
    return null;
  },

  preferredActivities(value) {
    if (!isStringArrayWithinSet(value, ACTIVITY_IDS) || (value as unknown[]).length === 0) {
      return 'Preferred activities must include at least one valid activity.';
    }
    return null;
  },

  exercisePreferences(value) {
    if (!isObject(value)) return 'Exercise preferences must be an object.';
    if (value.favoriteExerciseNotes !== undefined && typeof value.favoriteExerciseNotes !== 'string') {
      return 'Favorite exercise notes must be a string.';
    }
    if (value.improvementExerciseNotes !== undefined && typeof value.improvementExerciseNotes !== 'string') {
      return 'Improvement exercise notes must be a string.';
    }
    if (value.muscleFocus !== undefined && !isStringArrayWithinSet(value.muscleFocus, MUSCLE_FOCUS_IDS)) {
      return 'Muscle focus contains an invalid value.';
    }
    return null;
  },

  equipment(value) {
    if (!isStringArrayWithinSet(value, EQUIPMENT_IDS) || (value as unknown[]).length === 0) {
      return 'Equipment must include at least one valid option.';
    }
    return null;
  },

  recovery(value) {
    if (!isObject(value)) return 'Recovery must be an object.';
    if (value.flags !== undefined && !isStringArrayWithinSet(value.flags, RECOVERY_FLAG_IDS)) {
      return 'Recovery flags contain an invalid value.';
    }
    if (value.notes !== undefined && typeof value.notes !== 'string') {
      return 'Recovery notes must be a string.';
    }
    return null;
  },

  nutritionPreferences(value) {
    if (!isObject(value)) return 'Nutrition preferences must be an object.';
    if (!(DIET_TYPE_IDS as readonly unknown[]).includes(value.dietType)) {
      return 'Diet type must be none, vegetarian, vegan or pescatarian.';
    }
    if (typeof value.kosher !== 'boolean') return 'Kosher must be true or false.';
    if (value.allergies !== undefined && !isStringArrayWithinSet(value.allergies, ALLERGY_IDS)) {
      return 'Allergies contain an invalid value.';
    }
    for (const [field, label] of [['allergyNotes', 'Other allergies'], ['dislikes', 'Disliked foods']] as const) {
      const text = value[field];
      if (text !== undefined && (typeof text !== 'string' || text.length > MAX_PREFERENCE_TEXT_LENGTH)) {
        return `${label} must be text of at most ${MAX_PREFERENCE_TEXT_LENGTH} characters.`;
      }
    }
    return null;
  },
};

/**
 * POST /onboarding/complete — every required answer, same rules as the ATLAS submit.
 * `storedWeightUnit`: her saved unit, used when the body carries no units.
 */
export function validateCompleteOnboardingPayload(body: unknown, storedWeightUnit: WeightUnit = 'kg'): string | null {
  if (!isObject(body)) {
    return 'Invalid request body.';
  }

  const context = { weightUnit: resolveWeightUnit(body, storedWeightUnit) };
  for (const field of ONBOARDING_FIELDS) {
    const value = body[field];
    if (value === undefined && !REQUIRED_ON_COMPLETE.includes(field)) continue;
    const error = FIELD_VALIDATORS[field](value, context);
    if (error) return error;
  }
  return null;
}

function isStepId(value: unknown): value is OnboardingStepId {
  return typeof value === 'string' && (ONBOARDING_STEP_IDS as readonly string[]).includes(value);
}

/** PATCH /onboarding — `{ step, answers }` with only that step's fields. */
export function validateOnboardingStepPayload(body: unknown, storedWeightUnit: WeightUnit = 'kg'): string | null {
  if (!isObject(body)) {
    return 'Invalid request body.';
  }
  if (!isStepId(body.step)) {
    return 'Step must be one of the onboarding steps.';
  }
  const answers = body.answers ?? {};
  if (!isObject(answers)) {
    return 'Answers must be an object.';
  }

  const allowed = ONBOARDING_STEP_FIELDS[body.step];
  const context = { weightUnit: resolveWeightUnit(answers, storedWeightUnit) };
  for (const [field, value] of Object.entries(answers)) {
    if (!(allowed as readonly string[]).includes(field)) {
      return `'${field}' is not part of the ${body.step} step.`;
    }
    if (value === undefined) continue;
    const error = FIELD_VALIDATORS[field as OnboardingField](value, context);
    if (error) return error;
  }
  return null;
}
