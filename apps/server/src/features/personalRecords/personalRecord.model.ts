import { Schema, model } from 'mongoose';
import { PERSONAL_RECORD_TYPE_IDS } from '../workouts/workout.constants';
import type { PersonalRecordDocument } from './personalRecord.types';

const personalRecordSchema = new Schema<PersonalRecordDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
  previousValue: { type: Number, required: true, min: 0 },
  newValue: { type: Number, required: true, min: 0 },
  type: { type: String, enum: PERSONAL_RECORD_TYPE_IDS, required: true },
  date: { type: Date, required: true, default: () => new Date() },
});

personalRecordSchema.index({ userId: 1, exerciseId: 1, type: 1 });

export const PersonalRecord = model<PersonalRecordDocument>('PersonalRecord', personalRecordSchema);
