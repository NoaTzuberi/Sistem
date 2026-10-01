import { Schema, model } from 'mongoose';
import { isDateString } from '../plans/planWeek';
import { BODY_MEASUREMENT_IDS, PROGRESS_PHOTO_POSE_IDS } from './bodyMetric.constants';
import type { BodyMetricDocument, ProgressPhotoFields } from './bodyMetric.types';

const progressPhotoSchema = new Schema<ProgressPhotoFields>(
  {
    publicId: { type: String, required: true },
    pose: { type: String, enum: PROGRESS_PHOTO_POSE_IDS, required: true },
    uploadedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

function hasOnlyKnownMeasurements(value: Map<string, number> | undefined): boolean {
  if (!value) return true;
  return [...value.keys()].every((key) => (BODY_MEASUREMENT_IDS as readonly string[]).includes(key));
}

const bodyMetricSchema = new Schema<BodyMetricDocument>(
  {
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // 'YYYY-MM-DD' in the trainee's time zone.
    date: {
      type: String,
      required: true,
      validate: { validator: isDateString, message: 'date must be YYYY-MM-DD.' },
    },
    // kg
    weight: { type: Number, min: 0 },
    // cm, keyed by BODY_MEASUREMENT_IDS (chest, waist, hips, arms, thighs).
    measurements: {
      type: Map,
      of: { type: Number, min: 0 },
      default: undefined,
      validate: { validator: hasOnlyKnownMeasurements, message: 'Unknown body measurement.' },
    },
    photos: { type: [progressPhotoSchema], default: [] },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

bodyMetricSchema.index({ traineeId: 1, date: -1 });

export const BodyMetric = model<BodyMetricDocument>('BodyMetric', bodyMetricSchema);
