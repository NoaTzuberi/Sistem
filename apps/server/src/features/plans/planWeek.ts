/**
 * Plan weeks are calendar weeks that start on Sunday in the trainee's time zone
 * (owner decision). Dates are 'YYYY-MM-DD' strings — date-only values have no time
 * zone, so a week can never shift by a day when read on a server in UTC.
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMidnight(dateString: string): Date {
  const [, year, month, day] = DATE_PATTERN.exec(dateString)!;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True for a real calendar date written as 'YYYY-MM-DD'. */
export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  return formatUtcDate(toUtcMidnight(value)) === value;
}

export function isSunday(dateString: string): boolean {
  return isDateString(dateString) && toUtcMidnight(dateString).getUTCDay() === 0;
}

export function addDays(dateString: string, days: number): string {
  return formatUtcDate(new Date(toUtcMidnight(dateString).getTime() + days * DAY_MS));
}

/** The calendar date of `instant` in `timezone`, e.g. '2026-10-04'. */
export function localDateString(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** The Sunday that starts the week containing `dateString`. */
export function weekStartOf(dateString: string): string {
  return addDays(dateString, -toUtcMidnight(dateString).getUTCDay());
}

/** The Sunday that starts the current week for someone in `timezone`. */
export function currentWeekStart(timezone: string, now: Date = new Date()): string {
  return weekStartOf(localDateString(now, timezone));
}
