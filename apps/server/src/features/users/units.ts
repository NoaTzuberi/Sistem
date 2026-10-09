import type { Language, UnitPreferences } from '@sistem/types';
import type { UserDocument } from './user.model';

// Body values are stored in kg and cm only (PRD §10); a trainee's units decide how the
// screens show them. The clients convert with @sistem/shared — the server only needs
// lb → kg for the onboarding weight, which is typed in her chosen unit. The language
// preference lives here too: it is the other display setting of PATCH /users/preferences.

export const KG_PER_LB = 0.45359237;

export const WEIGHT_UNIT_IDS = ['kg', 'lb'] as const;
export const LENGTH_UNIT_IDS = ['cm', 'in'] as const;

export const DEFAULT_UNITS: UnitPreferences = { weight: 'kg', length: 'cm' };

/** Two decimals: precise enough that a value typed in lb shows back the same in lb. */
export function roundStoredValue(value: number): number {
  return Math.round(value * 100) / 100;
}

export function lbToKg(lb: number): number {
  return roundStoredValue(lb * KG_PER_LB);
}

export function resolveUnits(preferences: UserDocument['preferences']): UnitPreferences {
  return {
    weight: preferences?.units?.weight ?? DEFAULT_UNITS.weight,
    length: preferences?.units?.length ?? DEFAULT_UNITS.length,
  };
}

// UI language (Phase 15): Hebrew unless she chose English in Settings.
export const LANGUAGE_IDS = ['he', 'en'] as const;
export const DEFAULT_LANGUAGE: Language = 'he';

export function resolveLanguage(preferences: UserDocument['preferences']): Language {
  return preferences?.language ?? DEFAULT_LANGUAGE;
}
