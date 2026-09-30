import { Types } from 'mongoose';
import { WorkoutTemplate } from './workoutTemplate.model';
import { Exercise } from '../exercises/exercise.model';
import type { Difficulty, Muscle, Equipment } from '../exercises/exercise.constants';
import type { ExerciseMedia } from '../exercises/exercise.types';
import type { WorkoutCategory, WorkoutGoal } from './workoutTemplate.constants';

export class WorkoutTemplateNotFoundError extends Error {}
export class WorkoutTemplateForbiddenError extends Error {}
export class InvalidExerciseReferenceError extends Error {}

export interface ListWorkoutTemplatesParams {
  userId: string;
  category?: WorkoutCategory;
  mine?: boolean;
}

export interface WorkoutTemplateExerciseInput {
  exerciseId: string;
  order: number;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: number;
  restTime?: number;
}

export interface WorkoutTemplateInput {
  name: string;
  description?: string;
  goal?: WorkoutGoal[];
  difficulty?: Difficulty;
  duration?: number;
  category?: WorkoutCategory;
  exercises: WorkoutTemplateExerciseInput[];
}

export interface PublicWorkoutTemplateExercise {
  order: number;
  defaultSets: number;
  defaultReps: string;
  defaultWeight?: number;
  restTime?: number;
  exercise: {
    id: string;
    slug: string;
    name: string;
    primaryMuscles: Muscle[];
    equipment: Equipment[];
    media: ExerciseMedia;
  };
}

export interface PublicWorkoutTemplate {
  id: string;
  name: string;
  description: string;
  goal: WorkoutGoal[];
  difficulty?: Difficulty;
  duration?: number;
  category?: WorkoutCategory;
  exercises: PublicWorkoutTemplateExercise[];
  isSystemTemplate: boolean;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedExerciseRef {
  _id: unknown;
  slug: string;
  name: string;
  primaryMuscles: Muscle[];
  equipment: Equipment[];
  media: ExerciseMedia;
}

interface WorkoutTemplateLeanDoc {
  _id: unknown;
  name: string;
  description?: string;
  goal: WorkoutGoal[];
  difficulty?: Difficulty;
  duration?: number;
  category?: WorkoutCategory;
  createdBy: unknown;
  createdAt: Date;
  updatedAt: Date;
  exercises: Array<{
    exerciseId: PopulatedExerciseRef | null;
    order: number;
    defaultSets: number;
    defaultReps: string;
    defaultWeight?: number;
    restTime?: number;
  }>;
}

function toPublicWorkoutTemplate(doc: WorkoutTemplateLeanDoc, requesterId: string): PublicWorkoutTemplate {
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description ?? '',
    goal: doc.goal,
    difficulty: doc.difficulty,
    duration: doc.duration,
    category: doc.category,
    isSystemTemplate: doc.createdBy === null,
    isOwner: doc.createdBy !== null && String(doc.createdBy) === requesterId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    exercises: doc.exercises
      .filter((entry) => entry.exerciseId !== null)
      .map((entry) => ({
        order: entry.order,
        defaultSets: entry.defaultSets,
        defaultReps: entry.defaultReps,
        defaultWeight: entry.defaultWeight,
        restTime: entry.restTime,
        exercise: {
          id: String(entry.exerciseId!._id),
          slug: entry.exerciseId!.slug,
          name: entry.exerciseId!.name,
          primaryMuscles: entry.exerciseId!.primaryMuscles,
          equipment: entry.exerciseId!.equipment,
          media: entry.exerciseId!.media,
        },
      }))
      .sort((a, b) => a.order - b.order),
  };
}

const EXERCISE_SUMMARY_FIELDS = 'slug name primaryMuscles equipment media';

export async function listWorkoutTemplates(params: ListWorkoutTemplatesParams): Promise<PublicWorkoutTemplate[]> {
  const filter: Record<string, unknown> = params.mine
    ? { createdBy: params.userId }
    : { $or: [{ createdBy: null }, { createdBy: params.userId }] };

  if (params.category) {
    filter.category = params.category;
  }

  const docs = await WorkoutTemplate.find(filter)
    .sort({ createdBy: -1, name: 1 })
    .populate('exercises.exerciseId', EXERCISE_SUMMARY_FIELDS)
    .lean<WorkoutTemplateLeanDoc[]>();

  return docs.map((doc) => toPublicWorkoutTemplate(doc, params.userId));
}

export async function getWorkoutTemplateById(id: string, userId: string): Promise<PublicWorkoutTemplate> {
  const doc = await WorkoutTemplate.findById(id)
    .populate('exercises.exerciseId', EXERCISE_SUMMARY_FIELDS)
    .lean<WorkoutTemplateLeanDoc>();

  if (!doc) {
    throw new WorkoutTemplateNotFoundError('Workout template not found.');
  }

  const isSystemTemplate = doc.createdBy === null;
  const isOwner = doc.createdBy !== null && String(doc.createdBy) === userId;

  if (!isSystemTemplate && !isOwner) {
    throw new WorkoutTemplateNotFoundError('Workout template not found.');
  }

  return toPublicWorkoutTemplate(doc, userId);
}

async function assertExercisesExist(exercises: WorkoutTemplateExerciseInput[]): Promise<void> {
  const ids = exercises.map((e) => e.exerciseId);
  const count = await Exercise.countDocuments({ _id: { $in: ids } });
  if (count !== new Set(ids).size) {
    throw new InvalidExerciseReferenceError('One or more exercises could not be found.');
  }
}

export async function createWorkoutTemplate(
  userId: string,
  input: WorkoutTemplateInput,
): Promise<PublicWorkoutTemplate> {
  await assertExercisesExist(input.exercises);

  const created = await WorkoutTemplate.create({
    name: input.name,
    description: input.description,
    goal: input.goal ?? [],
    difficulty: input.difficulty,
    duration: input.duration,
    category: input.category,
    exercises: input.exercises.map((e) => ({ ...e, exerciseId: new Types.ObjectId(e.exerciseId) })),
    createdBy: userId,
  });

  return getWorkoutTemplateById(String(created._id), userId);
}

async function findOwnedTemplateOrThrow(id: string, userId: string) {
  const template = await WorkoutTemplate.findById(id);
  if (!template) {
    throw new WorkoutTemplateNotFoundError('Workout template not found.');
  }
  if (template.createdBy === null || String(template.createdBy) !== userId) {
    throw new WorkoutTemplateForbiddenError('You do not have permission to modify this workout template.');
  }
  return template;
}

export async function updateWorkoutTemplate(
  id: string,
  userId: string,
  input: WorkoutTemplateInput,
): Promise<PublicWorkoutTemplate> {
  await assertExercisesExist(input.exercises);

  const template = await findOwnedTemplateOrThrow(id, userId);

  template.name = input.name;
  template.description = input.description;
  template.goal = input.goal ?? [];
  template.difficulty = input.difficulty;
  template.duration = input.duration;
  template.category = input.category;
  template.exercises = input.exercises.map((e) => ({ ...e, exerciseId: new Types.ObjectId(e.exerciseId) }));

  await template.save();

  return getWorkoutTemplateById(id, userId);
}

export async function deleteWorkoutTemplate(id: string, userId: string): Promise<void> {
  const template = await findOwnedTemplateOrThrow(id, userId);
  await template.deleteOne();
}
