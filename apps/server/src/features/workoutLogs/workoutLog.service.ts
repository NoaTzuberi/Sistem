import { Types } from 'mongoose';
import type { WorkoutLog as PublicWorkoutLog } from '@sistem/types';
import { getExerciseFactsByIds } from '../exercises/exercise.service';
import { personalRecordsByLog } from '../personalRecords/personalRecord.service';
import { toPublicPhoto } from '../privatePhotos/privatePhoto.service';
import { WorkoutLog } from './workoutLog.model';
import type { WorkoutLogDocument } from './workoutLog.types';

export class WorkoutLogNotFoundError extends Error {}

type LeanWorkoutLog = WorkoutLogDocument & { _id: Types.ObjectId };

// The photo's storage id is never sent — only a short-lived signed link, made here for
// whoever passed the access check (the trainee herself or her coach).
export function toPublicWorkoutLog(log: LeanWorkoutLog): PublicWorkoutLog {
  return {
    id: String(log._id),
    traineeId: String(log.traineeId),
    planId: String(log.planId),
    workoutId: String(log.workoutId),
    workoutTitle: log.workoutTitle,
    status: log.status,
    startedAt: log.startedAt.toISOString(),
    finishedAt: log.finishedAt ? log.finishedAt.toISOString() : null,
    sets: log.sets.map((set) => ({
      exerciseId: String(set.exerciseId),
      planExerciseId: set.planExerciseId ? String(set.planExerciseId) : undefined,
      setIndex: set.setIndex,
      type: set.type,
      reps: set.reps,
      weight: set.weight,
      durationSec: set.durationSec,
      completed: set.completed,
      completedAt: set.completedAt?.toISOString(),
    })),
    stats: log.stats ?? null,
    rating: log.rating,
    notes: log.notes,
    pumpPhoto: log.pumpPhoto ? toPublicPhoto(log.pumpPhoto) : null,
  };
}

/** Adds the facts (names) of the logged exercises, in place — one query for all logs. */
export async function attachLogExerciseFacts(logs: PublicWorkoutLog[]): Promise<void> {
  const exerciseIds = new Set(logs.flatMap((log) => log.sets.map((set) => set.exerciseId)));
  const facts = await getExerciseFactsByIds([...exerciseIds]);
  for (const log of logs) {
    const ids = [...new Set(log.sets.map((set) => set.exerciseId))];
    log.exercises = ids.flatMap((id) => facts.get(id) ?? []);
  }
}

/** Exercise names and PR lines for read screens (trainee + coach), in place. */
export async function attachLogDetails(logs: PublicWorkoutLog[]): Promise<void> {
  const [records] = await Promise.all([
    personalRecordsByLog(logs.map((log) => new Types.ObjectId(log.id))),
    attachLogExerciseFacts(logs),
  ]);
  for (const log of logs) log.personalRecords = records.get(log.id) ?? [];
}

/** Discarded sessions stay in the database but are not part of her history. */
export async function listWorkoutLogsForTrainee(traineeId: string): Promise<PublicWorkoutLog[]> {
  const logs = await WorkoutLog.find({ traineeId, status: { $ne: 'abandoned' } }).sort({ startedAt: -1 }).lean<LeanWorkoutLog[]>();
  const publicLogs = logs.map(toPublicWorkoutLog);
  await attachLogDetails(publicLogs);
  return publicLogs;
}

/** Scoped by owner in the query itself — another trainee's log is simply not found. */
export async function getWorkoutLogForTrainee(logId: string, traineeId: string): Promise<PublicWorkoutLog> {
  const log = await WorkoutLog.findOne({ _id: logId, traineeId }).lean<LeanWorkoutLog>();
  if (!log) {
    throw new WorkoutLogNotFoundError('Workout log not found.');
  }
  const publicLog = toPublicWorkoutLog(log);
  await attachLogDetails([publicLog]);
  return publicLog;
}
