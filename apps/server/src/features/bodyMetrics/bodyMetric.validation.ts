import type { ProgressPhotoPose, SaveBodyMetricPayload } from '@sistem/types';
import { isDateString } from '../plans/planWeek';
import {
  BODY_MEASUREMENT_IDS,
  MAX_BODY_WEIGHT_KG,
  MAX_MEASUREMENT_CM,
  MIN_BODY_METRIC_DATE,
  MIN_BODY_WEIGHT_KG,
  MIN_MEASUREMENT_CM,
  PROGRESS_PHOTO_POSE_IDS,
} from './bodyMetric.constants';
import { type ServerMessage, msg } from '../../i18n';

type Parsed<T> = { value: T; error?: undefined } | { value?: undefined; error: ServerMessage };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

/**
 * The :date of a day — a real 'YYYY-MM-DD', not before MIN_BODY_METRIC_DATE. "Not in
 * the future" needs her time zone, so the service checks that.
 */
export function validateBodyMetricDateParam(value: unknown): ServerMessage | null {
  if (!isDateString(value)) return msg('body_date_invalid');
  if (value < MIN_BODY_METRIC_DATE) return msg('body_date_too_early', { min: MIN_BODY_METRIC_DATE });
  return null;
}

export function parsePoseParam(value: unknown): Parsed<ProgressPhotoPose> {
  if (!(PROGRESS_PHOTO_POSE_IDS as readonly unknown[]).includes(value)) {
    return { error: msg('body_pose_invalid') };
  }
  return { value: value as ProgressPhotoPose };
}

/** PUT /body-metrics/:date — kg and cm; null clears a value; at least one value. */
export function parseSaveBodyMetricPayload(body: unknown): Parsed<SaveBodyMetricPayload> {
  if (!isObject(body)) return { error: msg('invalid_body') };
  const { weight, measurements, ...unknown } = body;
  if (Object.keys(unknown).length > 0) return { error: msg('body_only_known_fields') };

  const payload: SaveBodyMetricPayload = {};
  if (weight !== undefined) {
    if (weight !== null && !isNumberInRange(weight, MIN_BODY_WEIGHT_KG, MAX_BODY_WEIGHT_KG)) {
      return { error: msg('body_weight_range', { min: MIN_BODY_WEIGHT_KG, max: MAX_BODY_WEIGHT_KG }) };
    }
    payload.weight = weight;
  }

  if (measurements !== undefined) {
    if (!isObject(measurements)) return { error: msg('body_measurements_not_object') };
    const values: Record<string, number | null> = {};
    for (const [id, value] of Object.entries(measurements)) {
      if (!(BODY_MEASUREMENT_IDS as readonly string[]).includes(id)) return { error: msg('body_measurement_unknown', { id }) };
      if (value !== null && !isNumberInRange(value, MIN_MEASUREMENT_CM, MAX_MEASUREMENT_CM)) {
        return { error: msg('body_measurement_range', { id, min: MIN_MEASUREMENT_CM, max: MAX_MEASUREMENT_CM }) };
      }
      values[id] = value;
    }
    payload.measurements = values;
  }

  if (payload.weight === undefined && Object.keys(payload.measurements ?? {}).length === 0) {
    return { error: msg('body_nothing_to_save') };
  }
  return { value: payload };
}
