import type { UpdatePreferencesPayload } from '@sistem/types';
import { LENGTH_UNIT_IDS, WEIGHT_UNIT_IDS } from './units';

type Parsed<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** PATCH /users/preferences: { units: { weight?: 'kg' | 'lb', length?: 'cm' | 'in' } }. */
export function parsePreferencesPayload(body: unknown): Parsed<UpdatePreferencesPayload> {
  if (!isObject(body) || !isObject(body.units)) return { error: 'units must be an object.' };
  const { weight, length, ...unknown } = body.units;
  if (Object.keys(unknown).length > 0) return { error: 'Only the weight and length units can be changed here.' };
  if (weight !== undefined && !(WEIGHT_UNIT_IDS as readonly unknown[]).includes(weight)) {
    return { error: "Weight unit must be 'kg' or 'lb'." };
  }
  if (length !== undefined && !(LENGTH_UNIT_IDS as readonly unknown[]).includes(length)) {
    return { error: "Length unit must be 'cm' or 'in'." };
  }
  if (weight === undefined && length === undefined) return { error: 'Send a weight or length unit.' };
  return {
    value: {
      units: {
        ...(weight !== undefined && { weight: weight as (typeof WEIGHT_UNIT_IDS)[number] }),
        ...(length !== undefined && { length: length as (typeof LENGTH_UNIT_IDS)[number] }),
      },
    },
  };
}
