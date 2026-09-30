import type { Types } from 'mongoose';
import type { PersonalRecordType } from '../workouts/workout.constants';

export interface PersonalRecordDocument {
  userId: Types.ObjectId;
  exerciseId: Types.ObjectId;
  previousValue: number;
  newValue: number;
  type: PersonalRecordType;
  date: Date;
}
