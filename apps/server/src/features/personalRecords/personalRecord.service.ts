import { Types } from 'mongoose';
import type { LogPersonalRecord } from '@sistem/types';
import { WorkoutLog } from '../workoutLogs/workoutLog.model';
import { PersonalRecord } from './personalRecord.model';
import type { PersonalRecordType } from './personalRecord.constants';
import { detectPersonalRecords } from './personalRecordDetection';
import type { DetectedPersonalRecord, PrSet } from './personalRecordDetection';

export interface PublicPersonalRecord {
  id: string;
  exercise: { id: string; slug: string; name: string };
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
  weight?: number;
  logId: string;
  date: Date;
}

interface PersonalRecordLeanDoc {
  _id: unknown;
  exerciseId: { _id: unknown; slug: string; name: string } | null;
  logId: Types.ObjectId;
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
  weight?: number;
  date: Date;
}

const DEFAULT_LIMIT = 10;
const DUPLICATE_KEY_ERROR = 11000;

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
      ...(doc.weight !== undefined && { weight: doc.weight }),
      logId: String(doc.logId),
      date: doc.date,
    }));
}

/**
 * Her PRs in this workout, compared with ALL her earlier completed workouts (not only
 * recent ones — a record is a record). Only the working sets of the exercises in this
 * workout are read, unwound in the database.
 */
export async function detectPersonalRecordsForLog(
  traineeId: Types.ObjectId,
  logId: Types.ObjectId,
  sets: PrSet[],
  intervalPlanExerciseIds: ReadonlySet<string>,
): Promise<DetectedPersonalRecord[]> {
  const exerciseIds = [...new Set(sets.filter((set) => set.completed).map((set) => set.exerciseId))];
  if (exerciseIds.length === 0) return [];

  const history = await WorkoutLog.aggregate<PrSet>([
    { $match: { traineeId, status: 'completed', _id: { $ne: logId } } },
    { $unwind: '$sets' },
    {
      $match: {
        'sets.exerciseId': { $in: exerciseIds.map((id) => new Types.ObjectId(id)) },
        'sets.completed': true,
        'sets.type': { $in: [null, 'working'] },
      },
    },
    {
      $project: {
        _id: 0,
        exerciseId: { $toString: '$sets.exerciseId' },
        type: '$sets.type',
        reps: '$sets.reps',
        weight: '$sets.weight',
        durationSec: '$sets.durationSec',
        completed: '$sets.completed',
      },
    },
  ]);
  return detectPersonalRecords(sets, history, intervalPlanExerciseIds);
}

/** Stores the PRs of a finished log. Safe to repeat: one PR per exercise per log. */
export async function savePersonalRecords(
  traineeId: Types.ObjectId,
  logId: Types.ObjectId,
  records: DetectedPersonalRecord[],
  date: Date,
): Promise<void> {
  if (records.length === 0) return;
  try {
    await PersonalRecord.insertMany(
      records.map((record) => ({ ...record, userId: traineeId, logId, date })),
      { ordered: false },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== DUPLICATE_KEY_ERROR) throw error;
  }
}

/** The PR lines of each log, keyed by log id — one query for all of them. */
export async function personalRecordsByLog(logIds: Types.ObjectId[]): Promise<Map<string, LogPersonalRecord[]>> {
  const byLog = new Map<string, LogPersonalRecord[]>();
  if (logIds.length === 0) return byLog;
  const docs = await PersonalRecord.find({ logId: { $in: logIds } })
    .sort({ _id: 1 })
    .lean<(Omit<PersonalRecordLeanDoc, 'exerciseId'> & { exerciseId: Types.ObjectId })[]>();
  for (const doc of docs) {
    const list = byLog.get(String(doc.logId)) ?? [];
    list.push({
      exerciseId: String(doc.exerciseId),
      type: doc.type,
      newValue: doc.newValue,
      previousValue: doc.previousValue,
      ...(doc.weight !== undefined && { weight: doc.weight }),
    });
    byLog.set(String(doc.logId), list);
  }
  return byLog;
}
