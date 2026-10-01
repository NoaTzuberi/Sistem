import type { Types } from 'mongoose';
import type { WorkoutLog as PublicWorkoutLog } from '@sistem/types';
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

export async function listWorkoutLogsForTrainee(traineeId: string): Promise<PublicWorkoutLog[]> {
  const logs = await WorkoutLog.find({ traineeId }).sort({ startedAt: -1 }).lean<LeanWorkoutLog[]>();
  return logs.map(toPublicWorkoutLog);
}

/** Scoped by owner in the query itself — another trainee's log is simply not found. */
export async function getWorkoutLogForTrainee(logId: string, traineeId: string): Promise<PublicWorkoutLog> {
  const log = await WorkoutLog.findOne({ _id: logId, traineeId }).lean<LeanWorkoutLog>();
  if (!log) {
    throw new WorkoutLogNotFoundError('Workout log not found.');
  }
  return toPublicWorkoutLog(log);
}
