import type { Language } from '@sistem/types';
import { fill, formatNumber, isolateLtr } from '@sistem/shared';

/** '+2 from last month' from a template with {change}; `noChange` when nothing moved. */
export function describeChange(change: number, template: string, noChange: string, language: Language): string {
  if (change === 0) return noChange;
  return fill(template, { change: isolateLtr(formatNumber(change, language, { signDisplay: 'always' })) });
}

/** Months before her first trainee have no data: null instead of a 0 that was never measured. */
export function valueSince<T extends { month: string }>(point: T, firstMonth: string | null, value: number): number | null {
  return firstMonth !== null && point.month >= firstMonth ? value : null;
}
