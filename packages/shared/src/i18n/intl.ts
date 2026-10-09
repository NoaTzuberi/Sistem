import type { Language } from '@sistem/types';
import { intlLocale } from './language';

// Dates, weekdays and numbers always come from Intl in the language on screen (Phase 15) —
// no hand-written month or day names. Formatters are cached: building them is slow.

const dateFormats = new Map<string, Intl.DateTimeFormat>();

export function dateFormat(language: Language, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${language}|${JSON.stringify(options)}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(intlLocale(language), options);
    dateFormats.set(key, format);
  }
  return format;
}

const numberFormats = new Map<string, Intl.NumberFormat>();

export function formatNumber(value: number, language: Language, options: Intl.NumberFormatOptions = {}): string {
  const key = `${language}|${JSON.stringify(options)}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(intlLocale(language), options);
    numberFormats.set(key, format);
  }
  return format.format(value);
}

const relativeFormats = new Map<Language, Intl.RelativeTimeFormat>();

export function formatRelative(value: number, unit: Intl.RelativeTimeFormatUnit, language: Language): string {
  let format = relativeFormats.get(language);
  if (!format) {
    format = new Intl.RelativeTimeFormat(intlLocale(language), { numeric: 'auto', style: 'short' });
    relativeFormats.set(language, format);
  }
  return format.format(value, unit);
}

// A known Sunday: weekday names are read from it, so index 0 is always Sunday (PRD: weeks start on Sunday).
const A_SUNDAY_MS = Date.UTC(2026, 0, 4);
const DAY_MS = 86_400_000;

/** Sunday = 0 … Saturday = 6, in the language on screen ('long' Sunday / יום ראשון, 'short' Sun / יום א׳). */
export function weekdayName(dayIndex: number, language: Language, width: 'long' | 'short' | 'narrow' = 'long'): string {
  return dateFormat(language, { weekday: width, timeZone: 'UTC' }).format(new Date(A_SUNDAY_MS + dayIndex * DAY_MS));
}
