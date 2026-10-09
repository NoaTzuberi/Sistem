import type { Language, LengthUnit, UnitPreferences, WeightUnit } from '@sistem/types';
import { sharedCopy } from './copy';
import { isolateLtr } from './i18n/bidi';

// Body values are stored and sent in kg and cm; these turn them into her units for the
// screen and back (Phase 10). The coach always sees kg / cm (DEFAULT_UNITS).

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const DEFAULT_UNITS: UnitPreferences = { weight: 'kg', length: 'cm' };

/** Values on screen are kept to one decimal. */
export function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** kg → her unit, one decimal. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return roundOneDecimal(unit === 'lb' ? kg / KG_PER_LB : kg);
}

/** Her unit → kg, as sent to the server (which keeps two decimals). */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

/** cm → her unit, one decimal. */
export function toDisplayLength(cm: number, unit: LengthUnit): number {
  return roundOneDecimal(unit === 'in' ? cm / CM_PER_IN : cm);
}

/** Her unit → cm. */
export function toCm(value: number, unit: LengthUnit): number {
  return unit === 'in' ? value * CM_PER_IN : value;
}

function formatNumber(value: number): string {
  return String(roundOneDecimal(value));
}

// A non-breaking space: a value never wraps away from its unit ('98.5 / cm').
const NBSP = '\u00a0';

/** The unit's word in the language on screen: 'kg' / 'ק״ג'. */
export function unitLabel(unit: WeightUnit | LengthUnit, language: Language): string {
  return sharedCopy[language].units[unit];
}

/** '61.4 kg' / '135.4 lb' / '61.4 ק״ג' */
export function formatWeight(kg: number, unit: WeightUnit, language: Language): string {
  return `${formatNumber(toDisplayWeight(kg, unit))}${NBSP}${unitLabel(unit, language)}`;
}

/** '70 cm' / '27.6 in' */
export function formatLength(cm: number, unit: LengthUnit, language: Language): string {
  return `${formatNumber(toDisplayLength(cm, unit))}${NBSP}${unitLabel(unit, language)}`;
}

/**
 * A change in her unit, signed: '+0.4 kg', '−1.2 in', '0 kg'. The sign stays in front of
 * the number in Hebrew text too (left-to-right isolate).
 */
export function formatSignedChange(displayDelta: number, unit: WeightUnit | LengthUnit, language: Language): string {
  const rounded = roundOneDecimal(displayDelta);
  const label = unitLabel(unit, language);
  if (rounded === 0) return `0${NBSP}${label}`;
  return `${isolateLtr(`${rounded > 0 ? '+' : '−'}${formatNumber(Math.abs(rounded))}`)}${NBSP}${label}`;
}

/**
 * Reads a number typed on the phone ('61,4' with a comma keypad works too). null when
 * empty or not a positive number.
 */
export function parseDecimalInput(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
}
