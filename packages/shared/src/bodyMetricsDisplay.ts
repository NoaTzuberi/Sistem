import type { BodyMetric, Language, LengthUnit, ProgressPhoto, ProgressPhotoPose, WeightUnit } from '@sistem/types';
import type { ChartPoint } from './bodyChart';
import { sharedCopy } from './copy';
import { humanizeId } from './format';
import { toDisplayLength, toDisplayWeight } from './units';

// Reading body tracking days (GET /body-metrics, newest first) for the screens of both
// apps: chart points, latest values, photo days. Placeholder labels (shared copy).

export const PROGRESS_PHOTO_POSES: ProgressPhotoPose[] = ['front', 'side', 'back'];

export function measurementLabel(id: string, language: Language): string {
  return (sharedCopy[language].body.measurements as Record<string, string>)[id] ?? humanizeId(id);
}

export function poseLabel(pose: ProgressPhotoPose, language: Language): string {
  return sharedCopy[language].body.poses[pose];
}

/** 'YYYY-MM-DD' today in a time zone — the default date of a new entry. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** Days with a weight, newest first. */
export function weighIns(metrics: BodyMetric[]): (BodyMetric & { weight: number })[] {
  return metrics.filter((metric): metric is BodyMetric & { weight: number } => metric.weight !== undefined);
}

/** Days with at least one measurement, newest first. */
export function measurementDays(metrics: BodyMetric[]): BodyMetric[] {
  return metrics.filter((metric) => Object.keys(metric.measurements).length > 0);
}

/** Days with at least one photo, newest first. */
export function photoDays(metrics: BodyMetric[]): BodyMetric[] {
  return metrics.filter((metric) => metric.photos.length > 0);
}

/** Weight chart points in her unit, oldest first. */
export function weightPoints(metrics: BodyMetric[], unit: WeightUnit): ChartPoint[] {
  return weighIns(metrics)
    .map((metric) => ({ date: metric.date, value: toDisplayWeight(metric.weight, unit) }))
    .reverse();
}

/** One measurement's chart points in her unit, oldest first. */
export function measurementPoints(metrics: BodyMetric[], id: string, unit: LengthUnit): ChartPoint[] {
  return metrics
    .filter((metric) => metric.measurements[id] !== undefined)
    .map((metric) => ({ date: metric.date, value: toDisplayLength(metric.measurements[id], unit) }))
    .reverse();
}

/** The latest value of each measurement (cm), in list order, with its date. */
export function latestMeasurements(metrics: BodyMetric[], ids: string[]): { id: string; cm: number; date: string }[] {
  return ids.flatMap((id) => {
    const latest = metrics.find((metric) => metric.measurements[id] !== undefined);
    return latest ? [{ id, cm: latest.measurements[id], date: latest.date }] : [];
  });
}

/** The photo of a pose on a day, if there is one. */
export function photoForPose(metric: BodyMetric | undefined, pose: ProgressPhotoPose): ProgressPhoto | undefined {
  return metric?.photos.find((photo) => photo.pose === pose);
}

/** The days that have a photo of this pose, oldest first — what Compare can pick from. */
export function photoDatesForPose(metrics: BodyMetric[], pose: ProgressPhotoPose): string[] {
  return metrics
    .filter((metric) => photoForPose(metric, pose) !== undefined)
    .map((metric) => metric.date)
    .reverse();
}
