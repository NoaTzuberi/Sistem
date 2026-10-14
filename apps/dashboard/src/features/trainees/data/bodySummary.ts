import type { BodyMetric, Language } from '@sistem/types';
import { formatNumber, isolateLtr, measurementDays, photoDays, roundOneDecimal, weighIns } from '@sistem/shared';

// The Body tab's numbers, read from the body days (GET …/body-metrics, newest first). Pure —
// the components only format and draw them. Always kg / cm on the coach's side.

const DAY_MS = 24 * 60 * 60 * 1000;

/** The measurement ids that have their own color (tokens --color-measure-*); others fall back to pink. */
const COLORED_MEASUREMENTS: ReadonlySet<string> = new Set(['chest', 'waist', 'hips', 'arms', 'thighs']);

/** The global class that sets --measure-color (and the chart / sparkline colors) for a measurement (styles/globals.css). */
export function measureColorClass(id: string): string {
  return `measure-color-${COLORED_MEASUREMENTS.has(id) ? id : 'other'}`;
}

export interface BodySummary {
  /** The newest weigh-in and the change from the one before it (null with a single one). */
  latestWeight: { kg: number; date: string; change: number | null } | null;
  /** From the first weigh-in to the newest; null with fewer than 2. */
  sinceStart: { change: number; fromDate: string; weeks: number } | null;
  measurements: { count: number; lastDate: string | null };
  photos: { count: number; lastDate: string | null };
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function summarizeBody(metrics: BodyMetric[]): BodySummary {
  const weights = weighIns(metrics);
  const [latest, previous] = weights;
  const first = weights.at(-1);
  const measured = measurementDays(metrics);
  const photographed = photoDays(metrics);
  return {
    latestWeight: latest
      ? { kg: latest.weight, date: latest.date, change: previous ? roundOneDecimal(latest.weight - previous.weight) : null }
      : null,
    sinceStart:
      latest && first && weights.length >= 2
        ? { change: roundOneDecimal(latest.weight - first.weight), fromDate: first.date, weeks: Math.floor(daysBetween(first.date, latest.date) / 7) }
        : null,
    measurements: { count: measured.length, lastDate: measured[0]?.date ?? null },
    photos: { count: photographed.reduce((sum, metric) => sum + metric.photos.length, 0), lastDate: photographed[0]?.date ?? null },
  };
}

/** '+0.4' / '−1.2' / '0' — the sign in front of the number in Hebrew text too. */
export function signedNumber(delta: number, language: Language): string {
  const rounded = roundOneDecimal(delta);
  if (rounded === 0) return formatNumber(0, language);
  return isolateLtr(`${rounded > 0 ? '+' : '−'}${formatNumber(Math.abs(rounded), language)}`);
}

/** One measurement over time: its points (oldest first), latest value and change since the first. */
export interface MeasurementSeries {
  id: string;
  values: number[];
  latest: number | null;
  change: number | null;
}

export function measurementSeries(metrics: BodyMetric[], ids: string[]): MeasurementSeries[] {
  return ids.map((id) => {
    const values = metrics
      .filter((metric) => metric.measurements[id] !== undefined)
      .map((metric) => metric.measurements[id])
      .reverse();
    const latest = values.at(-1) ?? null;
    return { id, values, latest, change: values.length >= 2 && latest !== null ? roundOneDecimal(latest - values[0]) : null };
  });
}

/** The weigh-in before this day's (older), for the table's small change. */
export function previousWeight(metrics: BodyMetric[], index: number): number | null {
  for (let older = index + 1; older < metrics.length; older += 1) {
    const weight = metrics[older].weight;
    if (weight !== undefined) return weight;
  }
  return null;
}
