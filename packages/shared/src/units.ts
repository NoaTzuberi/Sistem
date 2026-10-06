import type { LengthUnit, UnitPreferences, WeightUnit } from '@sistem/types';

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

/** '61.4 kg' / '135.4 lb' */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${formatNumber(toDisplayWeight(kg, unit))}${NBSP}${unit}`;
}

/** '70 cm' / '27.6 in' */
export function formatLength(cm: number, unit: LengthUnit): string {
  return `${formatNumber(toDisplayLength(cm, unit))}${NBSP}${unit}`;
}

/** A change in her unit, signed: '+0.4 kg', '−1.2 in', '0 kg'. */
export function formatSignedChange(displayDelta: number, unit: string): string {
  const rounded = roundOneDecimal(displayDelta);
  if (rounded === 0) return `0${NBSP}${unit}`;
  return `${rounded > 0 ? '+' : '−'}${formatNumber(Math.abs(rounded))}${NBSP}${unit}`;
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
