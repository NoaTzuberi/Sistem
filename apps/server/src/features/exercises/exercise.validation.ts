import {
  CATEGORY_IDS,
  MUSCLE_IDS,
  EQUIPMENT_IDS,
  DIFFICULTY_IDS,
  MOVEMENT_TYPE_IDS,
  EXERCISE_GOAL_IDS,
  MECHANIC_IDS,
  FORCE_TYPE_IDS,
} from './exercise.constants';

const MIN_PAGE = 1;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function isStringInSet(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function validateExerciseListQuery(query: unknown): string | null {
  if (typeof query !== 'object' || query === null) {
    return 'Invalid query parameters.';
  }

  const params = query as Record<string, unknown>;

  if (params.page !== undefined) {
    const page = Number(params.page);
    if (!Number.isInteger(page) || page < MIN_PAGE) {
      return `page must be an integer of at least ${MIN_PAGE}.`;
    }
  }

  if (params.limit !== undefined) {
    const limit = Number(params.limit);
    if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      return `limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}.`;
    }
  }

  if (params.category !== undefined && !isStringInSet(params.category, CATEGORY_IDS)) {
    return 'category must be one of the supported category values.';
  }

  if (params.muscle !== undefined && !isStringInSet(params.muscle, MUSCLE_IDS)) {
    return 'muscle must be one of the supported muscle values.';
  }

  if (params.equipment !== undefined && !isStringInSet(params.equipment, EQUIPMENT_IDS)) {
    return 'equipment must be one of the supported equipment values.';
  }

  if (params.difficulty !== undefined && !isStringInSet(params.difficulty, DIFFICULTY_IDS)) {
    return 'difficulty must be one of the supported difficulty values.';
  }

  if (params.movementType !== undefined && !isStringInSet(params.movementType, MOVEMENT_TYPE_IDS)) {
    return 'movementType must be one of the supported movement type values.';
  }

  if (params.goal !== undefined && !isStringInSet(params.goal, EXERCISE_GOAL_IDS)) {
    return 'goal must be one of the supported goal values.';
  }

  if (params.mechanic !== undefined && !isStringInSet(params.mechanic, MECHANIC_IDS)) {
    return 'mechanic must be one of the supported mechanic values.';
  }

  if (params.forceType !== undefined && !isStringInSet(params.forceType, FORCE_TYPE_IDS)) {
    return 'forceType must be one of the supported force type values.';
  }

  if (params.isUnilateral !== undefined && params.isUnilateral !== 'true' && params.isUnilateral !== 'false') {
    return "isUnilateral must be 'true' or 'false'.";
  }

  if (params.search !== undefined && typeof params.search !== 'string') {
    return 'search must be a string.';
  }

  return null;
}

export function validateSlugParam(slug: unknown): string | null {
  if (typeof slug !== 'string' || slug.trim().length === 0) {
    return 'A valid exercise slug is required.';
  }
  return null;
}
