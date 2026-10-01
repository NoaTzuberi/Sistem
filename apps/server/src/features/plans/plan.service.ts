import type { Types } from 'mongoose';
import type { Plan as PublicPlan, PlanExercise, PlanWorkout } from '@sistem/types';
import { Plan } from './plan.model';
import { resolvePlanExerciseSets } from './planSets';
import type { PlanDocument, PlanExerciseFields, PlanWorkoutFields } from './plan.types';

export class PlanNotFoundError extends Error {}

type LeanPlan = PlanDocument & { _id: Types.ObjectId };

function toPublicExercise(exercise: PlanExerciseFields & { _id: Types.ObjectId }): PlanExercise {
  return {
    id: String(exercise._id),
    exerciseId: String(exercise.exerciseId),
    sets: exercise.sets,
    reps: exercise.reps,
    repsMax: exercise.repsMax,
    durationSec: exercise.durationSec,
    targetWeight: exercise.targetWeight,
    restSec: exercise.restSec,
    notes: exercise.notes,
    supersetGroup: exercise.supersetGroup,
    setTargets: exercise.setTargets?.length ? exercise.setTargets : undefined,
    resolvedSets: resolvePlanExerciseSets(exercise),
  };
}

function toPublicWorkout(workout: PlanWorkoutFields & { _id: Types.ObjectId }): PlanWorkout {
  return {
    id: String(workout._id),
    title: workout.title,
    dayOfWeek: workout.dayOfWeek,
    order: workout.order,
    notes: workout.notes,
    exercises: workout.exercises.map(toPublicExercise),
  };
}

export function toPublicPlan(plan: LeanPlan): PublicPlan {
  return {
    id: String(plan._id),
    traineeId: String(plan.traineeId),
    coachId: String(plan.coachId),
    weekStartDate: plan.weekStartDate,
    status: plan.status,
    publishedAt: plan.publishedAt ? plan.publishedAt.toISOString() : null,
    notes: plan.notes,
    workouts: [...plan.workouts].sort((a, b) => a.order - b.order).map(toPublicWorkout),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

interface ListPlansOptions {
  /** Drafts are the coach's work in progress — trainees never see them. */
  includeDrafts: boolean;
}

export async function listPlansForTrainee(traineeId: string, { includeDrafts }: ListPlansOptions): Promise<PublicPlan[]> {
  const filter: Record<string, unknown> = includeDrafts ? { traineeId } : { traineeId, status: 'published' };
  const plans = await Plan.find(filter).sort({ weekStartDate: -1 }).lean<LeanPlan[]>();
  return plans.map(toPublicPlan);
}

/** A trainee's own published plan. Someone else's plan or a draft looks the same: not found. */
export async function getPublishedPlanForTrainee(planId: string, traineeId: string): Promise<PublicPlan> {
  const plan = await Plan.findOne({ _id: planId, traineeId, status: 'published' }).lean<LeanPlan>();
  if (!plan) {
    throw new PlanNotFoundError('Plan not found.');
  }
  return toPublicPlan(plan);
}

export async function hasPublishedPlan(traineeId: string): Promise<boolean> {
  return (await Plan.exists({ traineeId, status: 'published' })) !== null;
}
