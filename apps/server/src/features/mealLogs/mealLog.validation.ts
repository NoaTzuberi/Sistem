import mongoose from 'mongoose';
import type { SaveMealLogPayload } from '@sistem/types';
import { isDateString, isSunday } from '../plans/planWeek';
import { MAX_MEAL_PORTIONS, MAX_MEALS, PORTION_GROUP_IDS } from '../nutrition/nutrition.constants';
import { isPortionCount } from '../nutrition/nutrition.validation';

// A day's marks: portions per group in steps of 0.5. The plan's own limit ("never more
// than planned") is applied by the service, which knows that day's plan.
const MAX_DAY_PORTIONS = MAX_MEALS * MAX_MEAL_PORTIONS;

export function validateMealLogDateParam(value: unknown): string | null {
  return isDateString(value) ? null : 'The date must be YYYY-MM-DD.';
}

export function validateMealIdParam(value: unknown): string | null {
  return typeof value === 'string' && mongoose.isValidObjectId(value) ? null : 'Invalid meal id.';
}

export function validateWeekStartQuery(value: unknown): string | null {
  return value === undefined || isSunday(value as string) ? null : 'weekStart must be a Sunday (YYYY-MM-DD).';
}

export function parseSaveMealLogPayload(body: unknown): { value: SaveMealLogPayload; error: null } | { value: null; error: string } {
  const eaten = (body as { eaten?: unknown } | null)?.eaten;
  if (typeof eaten !== 'object' || eaten === null) return { value: null, error: 'Send the day\'s portions.' };
  const record = eaten as Record<string, unknown>;
  if (!PORTION_GROUP_IDS.every((group) => isPortionCount(record[group] ?? 0, MAX_DAY_PORTIONS))) {
    return { value: null, error: 'Portions go in steps of 0.5.' };
  }
  return {
    value: { eaten: { protein: (record.protein as number) ?? 0, carb: (record.carb as number) ?? 0, fat: (record.fat as number) ?? 0 } },
    error: null,
  };
}
