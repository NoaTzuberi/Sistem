import { Schema, model } from 'mongoose';
import type { ProgressDocument, BodyMeasurements } from './progress.types';

const bodyMeasurementsSchema = new Schema<BodyMeasurements>(
  {
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    legs: { type: Number, min: 0 },
  },
  { _id: false },
);

const progressSchema = new Schema<ProgressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: () => new Date() },
    weight: { type: Number, min: 0, default: undefined },
    bodyMeasurements: { type: bodyMeasurementsSchema, default: undefined },
    photos: { type: [String], default: [] },
    notes: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, date: -1 });

export const Progress = model<ProgressDocument>('Progress', progressSchema);
