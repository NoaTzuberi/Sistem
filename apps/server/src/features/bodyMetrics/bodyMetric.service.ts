import type { Types } from 'mongoose';
import type { BodyMetric as PublicBodyMetric } from '@sistem/types';
import { BodyMetric } from './bodyMetric.model';
import type { BodyMetricDocument } from './bodyMetric.types';

type LeanBodyMetric = Omit<BodyMetricDocument, 'measurements'> & {
  _id: Types.ObjectId;
  // .lean() returns a Map field as a plain object.
  measurements?: Record<string, number>;
};

// Photo storage ids are never sent; Phase 10 adds signed URLs here.
export function toPublicBodyMetric(metric: LeanBodyMetric): PublicBodyMetric {
  return {
    id: String(metric._id),
    traineeId: String(metric.traineeId),
    date: metric.date,
    weight: metric.weight,
    measurements: metric.measurements ?? {},
    photos: metric.photos.map((photo) => ({ pose: photo.pose, uploadedAt: photo.uploadedAt.toISOString() })),
    notes: metric.notes,
  };
}

export async function listBodyMetricsForTrainee(traineeId: string): Promise<PublicBodyMetric[]> {
  const metrics = await BodyMetric.find({ traineeId }).sort({ date: -1, createdAt: -1 }).lean<LeanBodyMetric[]>();
  return metrics.map(toPublicBodyMetric);
}
