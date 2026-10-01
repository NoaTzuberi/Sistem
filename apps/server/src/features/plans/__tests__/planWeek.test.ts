import { describe, it, expect } from 'vitest';
import { addDays, currentWeekStart, isDateString, isSunday, localDateString, weekStartOf } from '../planWeek';

describe('planWeek', () => {
  it('validates date strings', () => {
    expect(isDateString('2026-10-04')).toBe(true);
    expect(isDateString('2026-02-30')).toBe(false);
    expect(isDateString('2026-10-4')).toBe(false);
    expect(isDateString(20261004)).toBe(false);
  });

  it('recognises Sundays', () => {
    expect(isSunday('2026-10-04')).toBe(true);
    expect(isSunday('2026-10-03')).toBe(false);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('starts every week on Sunday', () => {
    expect(weekStartOf('2026-10-04')).toBe('2026-10-04'); // Sunday
    expect(weekStartOf('2026-10-07')).toBe('2026-10-04'); // Wednesday
    expect(weekStartOf('2026-10-10')).toBe('2026-10-04'); // Saturday
    expect(weekStartOf('2026-10-01')).toBe('2026-09-27'); // across a month
  });

  it('uses the local date in the given time zone, not UTC', () => {
    // Saturday 22:30 UTC is already Sunday 01:30 in Jerusalem (UTC+3 in October).
    const saturdayNightUtc = new Date('2026-10-03T22:30:00Z');
    expect(localDateString(saturdayNightUtc, 'Asia/Jerusalem')).toBe('2026-10-04');
    expect(currentWeekStart('Asia/Jerusalem', saturdayNightUtc)).toBe('2026-10-04');
    // …while it is still Saturday in New York, so that week started a week earlier.
    expect(currentWeekStart('America/New_York', saturdayNightUtc)).toBe('2026-09-27');
  });
});
