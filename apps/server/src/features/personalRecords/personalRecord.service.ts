import { PersonalRecord } from './personalRecord.model';
import type { PersonalRecordType } from '../workouts/workout.constants';

export interface PublicPersonalRecord {
  id: string;
  exercise: { id: string; slug: string; name: string };
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
  date: Date;
}

interface PersonalRecordLeanDoc {
  _id: unknown;
  exerciseId: { _id: unknown; slug: string; name: string } | null;
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
  date: Date;
}

const DEFAULT_LIMIT = 10;

export async function listPersonalRecords(userId: string, limit = DEFAULT_LIMIT): Promise<PublicPersonalRecord[]> {
  const docs = await PersonalRecord.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('exerciseId', 'slug name')
    .lean<PersonalRecordLeanDoc[]>();

  return docs
    .filter((doc) => doc.exerciseId !== null)
    .map((doc) => ({
      id: String(doc._id),
      exercise: {
        id: String(doc.exerciseId!._id),
        slug: doc.exerciseId!.slug,
        name: doc.exerciseId!.name,
      },
      type: doc.type,
      previousValue: doc.previousValue,
      newValue: doc.newValue,
      date: doc.date,
    }));
}
