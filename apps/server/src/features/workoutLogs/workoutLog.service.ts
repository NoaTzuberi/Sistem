import type { Types } from 'mongoose';
import type { WorkoutLog as PublicWorkoutLog } from '@sistem/types';
import { getExerciseFactsByIds } from '../exercises/exercise.service';
import { WorkoutLog } from './workoutLog.model';
import type { WorkoutLogDocument } from './workoutLog.types';

export class WorkoutLogNotFoundError extends Error {}

type LeanWorkoutLog = WorkoutLogDocument & { _id: Types.ObjectId };

// The photo's storage id is never sent; Phase 9 adds a signed URL here.
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
    pumpPhoto: log.pumpPhoto ? { uploadedAt: log.pumpPhoto.uploadedAt.toISOString() } : null,
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

/** Discarded sessions stay in the database but are not part of her history. */
export async function listWorkoutLogsForTrainee(traineeId: string): Promise<PublicWorkoutLog[]> {
  const logs = await WorkoutLog.find({ traineeId, status: { $ne: 'abandoned' } }).sort({ startedAt: -1 }).lean<LeanWorkoutLog[]>();
  return logs.map(toPublicWorkoutLog);
}

/** Scoped by owner in the query itself — another trainee's log is simply not found. */
export async function getWorkoutLogForTrainee(logId: string, traineeId: string): Promise<PublicWorkoutLog> {
  const log = await WorkoutLog.findOne({ _id: logId, traineeId }).lean<LeanWorkoutLog>();
  if (!log) {
    throw new WorkoutLogNotFoundError('Workout log not found.');
  }
  const publicLog = toPublicWorkoutLog(log);
  await attachLogExerciseFacts([publicLog]);
  return publicLog;
}
