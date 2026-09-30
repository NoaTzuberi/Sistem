interface BodyMeasurementsInput {
  chest?: unknown;
  waist?: unknown;
  legs?: unknown;
}

interface ProgressInput {
  date?: unknown;
  weight?: unknown;
  bodyMeasurements?: unknown;
  notes?: unknown;
}

function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && value >= 0;
}

export function validateProgressPayload(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Invalid request body.';
  }

  const payload = body as ProgressInput;

  if (payload.date !== undefined) {
    if (typeof payload.date !== 'string' || Number.isNaN(Date.parse(payload.date))) {
      return 'date must be a valid ISO date string.';
    }
  }

  if (payload.weight !== undefined && !isPositiveNumber(payload.weight)) {
    return 'weight must be a non-negative number.';
  }

  if (payload.bodyMeasurements !== undefined) {
    if (typeof payload.bodyMeasurements !== 'object' || payload.bodyMeasurements === null) {
      return 'bodyMeasurements must be an object.';
    }
    const m = payload.bodyMeasurements as BodyMeasurementsInput;
    if (m.chest !== undefined && !isPositiveNumber(m.chest)) {
      return 'bodyMeasurements.chest must be a non-negative number.';
    }
    if (m.waist !== undefined && !isPositiveNumber(m.waist)) {
      return 'bodyMeasurements.waist must be a non-negative number.';
    }
    if (m.legs !== undefined && !isPositiveNumber(m.legs)) {
      return 'bodyMeasurements.legs must be a non-negative number.';
    }
  }

  if (payload.notes !== undefined && typeof payload.notes !== 'string') {
    return 'notes must be a string.';
  }

  if (
    payload.weight === undefined &&
    payload.bodyMeasurements === undefined &&
    payload.notes === undefined
  ) {
    return 'At least one of weight, bodyMeasurements, or notes is required.';
  }

  return null;
}

export function validateListQuery(query: unknown): string | null {
  if (typeof query !== 'object' || query === null) {
    return 'Invalid query parameters.';
  }

  const params = query as Record<string, unknown>;

  if (params.limit !== undefined) {
    const limit = Number(params.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      return 'limit must be an integer between 1 and 200.';
    }
  }

  return null;
}
