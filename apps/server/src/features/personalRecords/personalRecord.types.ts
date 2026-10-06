import type { Types } from 'mongoose';
import type { PersonalRecordType } from './personalRecord.constants';

// Units: kg for weight, seconds for duration, a count for reps.
export interface PersonalRecordDocument {
  userId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  // The workout log the PR was hit in — one PR per exercise per log.
  logId: Types.ObjectId;
  previousValue: number;
  newValue: number;
  type: PersonalRecordType;
  // The weight a reps / duration PR was done at (absent = bodyweight / none).
  weight?: number;
  date: Date;
}
