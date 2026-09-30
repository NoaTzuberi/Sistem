import { Types } from 'mongoose';
import { Workout } from './workout.model';
import { WorkoutTemplate } from '../workoutTemplates/workoutTemplate.model';
import { Exercise } from '../exercises/exercise.model';
import { PersonalRecord } from '../personalRecords/personalRecord.model';
import type { Muscle, Equipment } from '../exercises/exercise.constants';
import type { ExerciseMedia } from '../exercises/exercise.types';
import type { WorkoutSet } from './workout.types';
import type { WorkoutStatus, PersonalRecordType } from './workout.constants';
import type { WorkoutCategory } from '../workoutTemplates/workoutTemplate.constants';

export class WorkoutNotFoundError extends Error {}
export class WorkoutForbiddenError extends Error {}
export class WorkoutNotActiveError extends Error {}

const EXERCISE_SUMMARY_FIELDS = 'slug name primaryMuscles equipment media';

interface PopulatedExerciseRef {
  _id: unknown;
  slug: string;
  name: string;
  primaryMuscles: Muscle[];
  equipment: Equipment[];
  media: ExerciseMedia;
}

interface WorkoutLeanDoc {
  _id: unknown;
  userId: unknown;
  templateId: unknown;
  name: string;
  date: Date;
  duration?: number;
  status: WorkoutStatus;
  totalVolume?: number;
  rating?: number;
  notes?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
  exercises: Array<{
    exerciseId: PopulatedExerciseRef | null;
    sets: WorkoutSet[];
  }>;
}

export interface PublicWorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface PublicWorkoutExercise {
  exercise: {
    id: string;
    slug: string;
    name: string;
    primaryMuscles: Muscle[];
    equipment: Equipment[];
    media: ExerciseMedia;
  };
  sets: PublicWorkoutSet[];
}

export interface PublicWorkout {
  id: string;
  templateId: string | null;
  name: string;
  date: Date;
  duration?: number;
  status: WorkoutStatus;
  totalVolume?: number;
  rating?: number;
  notes?: string;
  photo?: string;
  exercises: PublicWorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

function toPublicWorkout(doc: WorkoutLeanDoc): PublicWorkout {
  return {
    id: String(doc._id),
    templateId: doc.templateId ? String(doc.templateId) : null,
    name: doc.name,
    date: doc.date,
    duration: doc.duration,
    status: doc.status,
    totalVolume: doc.totalVolume,
    rating: doc.rating,
    notes: doc.notes,
    photo: doc.photo,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    exercises: doc.exercises
      .filter((entry) => entry.exerciseId !== null)
      .map((entry) => ({
        exercise: {
          id: String(entry.exerciseId!._id),
          slug: entry.exerciseId!.slug,
          name: entry.exerciseId!.name,
          primaryMuscles: entry.exerciseId!.primaryMuscles,
          equipment: entry.exerciseId!.equipment,
          media: entry.exerciseId!.media,
        },
        sets: entry.sets,
      })),
  };
}

async function loadPublicWorkout(id: Types.ObjectId | string): Promise<PublicWorkout> {
  const doc = await Workout.findById(id)
    .populate('exercises.exerciseId', EXERCISE_SUMMARY_FIELDS)
    .lean<WorkoutLeanDoc>();
  if (!doc) {
    throw new WorkoutNotFoundError('Workout not found.');
  }
  return toPublicWorkout(doc);
}

/** First leading number in a reps target like "8-12" or "30s" — a best-effort
 * starting value for a set the user hasn't logged yet, not a parsed unit. */
function parseRepsTarget(defaultReps: string): number {
  const match = defaultReps.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

interface WeightMemoryEntry {
  weight: number;
  reps: number;
}

interface UnpopulatedWorkoutLeanDoc {
  date: Date;
  exercises: Array<{ exerciseId: unknown; sets: WorkoutSet[] }>;
}

/** Most recent completed session that logged this exact exercise (by id, not
 * name), regardless of which template it came from or whether it was created
 * by the user or a system template. Recency, not an average across sessions. */
async function findLastCompletedExerciseEntry(
  userId: string,
  exerciseId: Types.ObjectId,
): Promise<{ date: Date; sets: WorkoutSet[] } | null> {
  const previous = await Workout.findOne({
    userId,
    status: 'completed',
    'exercises.exerciseId': exerciseId,
  })
    .sort({ date: -1 })
    .lean<UnpopulatedWorkoutLeanDoc>();

  if (!previous) return null;

  const entry = previous.exercises.find((e) => String(e.exerciseId) === String(exerciseId));
  if (!entry) return null;

  return { date: previous.date, sets: entry.sets };
}

async function getWeightMemory(userId: string, exerciseId: Types.ObjectId): Promise<WeightMemoryEntry[]> {
  const found = await findLastCompletedExerciseEntry(userId, exerciseId);
  return found ? found.sets.map((s) => ({ weight: s.weight, reps: s.reps })) : [];
}

export interface LastLoggedExercise {
  sets: number;
  reps: number;
  weight: number;
  date: Date;
}

/**
 * Powers the Create Workout builder's history autofill: the single most
 * recent completed set logged for this exercise (last completed set of the
 * last completed session that included it), collapsed into one
 * sets/reps/weight starting point. Only completed sets count — an abandoned
 * warm-up set shouldn't shape the suggestion.
 */
export async function getLastLoggedExercise(userId: string, exerciseId: string): Promise<LastLoggedExercise | null> {
  const found = await findLastCompletedExerciseEntry(userId, new Types.ObjectId(exerciseId));
  if (!found) return null;

  const completedSets = found.sets.filter((s) => s.completed);
  if (completedSets.length === 0) return null;

  const last = completedSets[completedSets.length - 1];
  return {
    sets: completedSets.length,
    reps: last.reps,
    weight: last.weight,
    date: found.date,
  };
}

/**
 * Only one active session per user — if one already exists, resume it rather
 * than starting a second (a gym session is inherently a single timeline).
 * templateId is ignored when resuming; the caller lands back on whichever
 * workout is actually in progress.
 */
export async function startWorkout(userId: string, templateId: string): Promise<PublicWorkout> {
  const existing = await Workout.findOne({ userId, status: 'in_progress' });
  if (existing) {
    return loadPublicWorkout(existing._id as Types.ObjectId);
  }

  const template = await WorkoutTemplate.findById(templateId);
  if (!template) {
    throw new WorkoutNotFoundError('Workout template not found.');
  }
  if (template.createdBy !== null && String(template.createdBy) !== userId) {
    throw new WorkoutNotFoundError('Workout template not found.');
  }

  const exercises = await Promise.all(
    template.exercises.map(async (templateEntry) => {
      const exerciseId = templateEntry.exerciseId as unknown as Types.ObjectId;
      const memory = await getWeightMemory(userId, exerciseId);

      const sets: WorkoutSet[] = Array.from({ length: templateEntry.defaultSets }, (_, i) => {
        const remembered = memory[i] ?? memory[memory.length - 1];
        return {
          setNumber: i + 1,
          weight: remembered?.weight ?? templateEntry.defaultWeight ?? 0,
          reps: remembered?.reps ?? parseRepsTarget(templateEntry.defaultReps),
          completed: false,
        };
      });

      return { exerciseId, sets };
    }),
  );

  const created = await Workout.create({
    userId,
    templateId: template._id,
    name: template.name,
    date: new Date(),
    status: 'in_progress',
    exercises,
  });

  return loadPublicWorkout(created._id as Types.ObjectId);
}

export async function getActiveWorkout(userId: string): Promise<PublicWorkout | null> {
  const doc = await Workout.findOne({ userId, status: 'in_progress' })
    .populate('exercises.exerciseId', EXERCISE_SUMMARY_FIELDS)
    .lean<WorkoutLeanDoc>();
  return doc ? toPublicWorkout(doc) : null;
}

export async function getWorkoutById(id: string, userId: string): Promise<PublicWorkout> {
  const doc = await Workout.findById(id)
    .populate('exercises.exerciseId', EXERCISE_SUMMARY_FIELDS)
    .lean<WorkoutLeanDoc>();
  if (!doc || String(doc.userId) !== userId) {
    throw new WorkoutNotFoundError('Workout not found.');
  }
  return toPublicWorkout(doc);
}

export interface WorkoutSummary {
  id: string;
  templateId: string | null;
  name: string;
  date: Date;
  status: WorkoutStatus;
  duration?: number;
  totalVolume?: number;
  category?: WorkoutCategory;
}

export interface ListWorkoutsParams {
  from?: string;
  to?: string;
  status?: WorkoutStatus;
  limit?: number;
}

/**
 * Lightweight listing (no populated exercises) for calendar/history views —
 * the full per-exercise breakdown from getWorkoutById is unnecessary just to
 * mark which days had a workout or show a name/duration in a list.
 */
export async function listWorkoutSummaries(userId: string, params: ListWorkoutsParams = {}): Promise<WorkoutSummary[]> {
  const filter: Record<string, unknown> = { userId };

  if (params.status) filter.status = params.status;

  if (params.from || params.to) {
    const dateFilter: Record<string, Date> = {};
    if (params.from) dateFilter.$gte = new Date(params.from);
    if (params.to) dateFilter.$lte = new Date(params.to);
    filter.date = dateFilter;
  }

  let queryBuilder = Workout.find(filter)
    .select('templateId name date status duration totalVolume')
    .populate('templateId', 'category')
    .sort({ date: -1 });
  if (params.limit) {
    queryBuilder = queryBuilder.limit(params.limit);
  }
  const docs = await queryBuilder.lean<
    Array<{
      _id: unknown;
      templateId: { _id: unknown; category?: WorkoutCategory } | null;
      name: string;
      date: Date;
      status: WorkoutStatus;
      duration?: number;
      totalVolume?: number;
    }>
  >();

  return docs.map((doc) => ({
    id: String(doc._id),
    templateId: doc.templateId ? String(doc.templateId._id) : null,
    name: doc.name,
    date: doc.date,
    status: doc.status,
    duration: doc.duration,
    totalVolume: doc.totalVolume,
    category: doc.templateId?.category,
  }));
}

async function findActiveOwnedWorkout(id: string, userId: string) {
  const workout = await Workout.findById(id);
  if (!workout || String(workout.userId) !== userId) {
    throw new WorkoutNotFoundError('Workout not found.');
  }
  if (workout.status !== 'in_progress') {
    throw new WorkoutNotActiveError('This workout is no longer in progress.');
  }
  return workout;
}

export interface ProgressExerciseInput {
  exerciseId: string;
  sets: WorkoutSet[];
}

export async function updateWorkoutProgress(
  id: string,
  userId: string,
  exercises: ProgressExerciseInput[],
): Promise<PublicWorkout> {
  const workout = await findActiveOwnedWorkout(id, userId);

  const setsByExerciseId = new Map(exercises.map((e) => [e.exerciseId, e.sets]));

  workout.exercises.forEach((entry) => {
    const incoming = setsByExerciseId.get(String(entry.exerciseId));
    if (incoming) {
      entry.sets = incoming;
    }
  });

  await workout.save();

  return loadPublicWorkout(workout._id as Types.ObjectId);
}

export async function abandonWorkout(id: string, userId: string): Promise<PublicWorkout> {
  const workout = await findActiveOwnedWorkout(id, userId);
  workout.status = 'abandoned';
  await workout.save();
  return loadPublicWorkout(workout._id as Types.ObjectId);
}

export interface NewPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: PersonalRecordType;
  previousValue: number;
  newValue: number;
}

export interface FinishWorkoutInput {
  rating?: number;
  notes?: string;
}

export interface FinishWorkoutResult {
  workout: PublicWorkout;
  newPersonalRecords: NewPersonalRecord[];
}

async function bestPersonalRecordValue(
  userId: string,
  exerciseId: Types.ObjectId,
  type: PersonalRecordType,
): Promise<number> {
  const latest = await PersonalRecord.findOne({ userId, exerciseId, type }).sort({ date: -1 });
  return latest?.newValue ?? 0;
}

export async function finishWorkout(
  id: string,
  userId: string,
  input: FinishWorkoutInput,
): Promise<FinishWorkoutResult> {
  const workout = await findActiveOwnedWorkout(id, userId);

  const durationMinutes = Math.max(1, Math.round((Date.now() - workout.createdAt.getTime()) / 60000));

  let totalVolume = 0;
  const newPersonalRecords: NewPersonalRecord[] = [];
  const recordsToInsert: Array<{
    userId: string;
    exerciseId: Types.ObjectId;
    previousValue: number;
    newValue: number;
    type: PersonalRecordType;
  }> = [];

  for (const entry of workout.exercises) {
    const completedSets = entry.sets.filter((s) => s.completed);
    if (completedSets.length === 0) continue;

    totalVolume += completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

    const sessionMaxWeight = Math.max(...completedSets.map((s) => s.weight));
    const sessionMaxReps = Math.max(...completedSets.map((s) => s.reps));

    const previousBestWeight = await bestPersonalRecordValue(userId, entry.exerciseId, 'weight');
    const previousBestReps = await bestPersonalRecordValue(userId, entry.exerciseId, 'reps');

    if (sessionMaxWeight > previousBestWeight) {
      recordsToInsert.push({
        userId,
        exerciseId: entry.exerciseId,
        previousValue: previousBestWeight,
        newValue: sessionMaxWeight,
        type: 'weight',
      });
    }
    if (sessionMaxReps > previousBestReps) {
      recordsToInsert.push({
        userId,
        exerciseId: entry.exerciseId,
        previousValue: previousBestReps,
        newValue: sessionMaxReps,
        type: 'reps',
      });
    }
  }

  if (recordsToInsert.length > 0) {
    await PersonalRecord.insertMany(recordsToInsert.map((r) => ({ ...r, date: new Date() })));

    const exerciseIds = [...new Set(recordsToInsert.map((r) => String(r.exerciseId)))];
    const exerciseDocs = await Exercise.find({ _id: { $in: exerciseIds } })
      .select('name')
      .lean();
    const nameById = new Map(exerciseDocs.map((e) => [String(e._id), e.name]));

    newPersonalRecords.push(
      ...recordsToInsert.map((r) => ({
        exerciseId: String(r.exerciseId),
        exerciseName: nameById.get(String(r.exerciseId)) ?? 'Exercise',
        type: r.type,
        previousValue: r.previousValue,
        newValue: r.newValue,
      })),
    );
  }

  workout.status = 'completed';
  workout.duration = durationMinutes;
  workout.totalVolume = totalVolume;
  workout.rating = input.rating;
  workout.notes = input.notes;

  await workout.save();

  return {
    workout: await loadPublicWorkout(workout._id as Types.ObjectId),
    newPersonalRecords,
  };
}
