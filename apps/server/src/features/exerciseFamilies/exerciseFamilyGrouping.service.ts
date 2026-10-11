import { Types, type AnyBulkWriteOperation } from 'mongoose';
import { DIFFICULTY_IDS, type Difficulty } from '../exercises/exercise.constants';
import { Exercise } from '../exercises/exercise.model';
import type { ExerciseDocument } from '../exercises/exercise.types';
import { tagPatterns } from '../exercises/exercisePatterns';
import { Plan } from '../plans/plan.model';
import { ExerciseFamily, type ExerciseFamilyFields } from './exerciseFamily.model';
import { assignVariants, groupExercises, type GroupingInput } from './exerciseFamilyGrouping';

// Runs the grouping over the whole library and stores it (npm run group:exercises; also at the
// end of import:exercises). Safe to re-run: auto families are matched by key; anything the coach
// set — moved exercises, family names / patterns, chosen primaries — is kept.

const LIBRARY_FILTER: Record<string, unknown> = { reviewStatus: { $ne: 'rejected' } };

type LibraryDoc = Pick<
  ExerciseDocument,
  'name' | 'primaryMuscles' | 'equipment' | 'difficulty' | 'movementType' | 'familyId' | 'familySource'
> & { _id: Types.ObjectId };

export function levelRange(difficulties: string[]): { min: Difficulty; max: Difficulty } {
  const indexes = difficulties.map((value) => DIFFICULTY_IDS.indexOf(value as Difficulty)).filter((index) => index >= 0);
  if (indexes.length === 0) return { min: 'beginner', max: 'beginner' };
  return { min: DIFFICULTY_IDS[Math.min(...indexes)], max: DIFFICULTY_IDS[Math.max(...indexes)] };
}

/** Every exercise any coach put in a plan: her taste wins when choosing a variant's primary. */
async function coachUsedExerciseIds(): Promise<string[]> {
  const ids = await Plan.distinct('workouts.exercises.exerciseId');
  return ids.map(String);
}

export interface RegroupSummary {
  exercises: number;
  families: number;
  familiesWithVariants: number;
  primaries: number;
  unclearPatterns: number;
  reviewList: number;
}

/** Sets variant / isPrimaryVariant / levels / muscles of one family from its current members. */
export async function refreshFamilyMembers(familyId: Types.ObjectId | string, extraPreferred: string[] = []): Promise<void> {
  const family = await ExerciseFamily.findById(familyId);
  if (!family) return;
  const members = await Exercise.find({ familyId: family._id, ...LIBRARY_FILTER })
    .select('name equipment difficulty primaryMuscles')
    .lean<LibraryDoc[]>();
  if (members.length === 0) {
    await ExerciseFamily.deleteOne({ _id: family._id });
    return;
  }
  const preferred = [...family.coachPrimaryIds.map(String), ...extraPreferred];
  const facts = members.map((member) => ({ id: String(member._id), name: member.name, equipment: member.equipment }));
  const { variants } = assignVariants(facts, preferred);
  await Exercise.bulkWrite(
    variants.map((variant) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(variant.exerciseId) },
        update: { $set: { variant: variant.variant, isPrimaryVariant: variant.primary } },
      },
    })),
  );
  const primaryIds = new Set(variants.filter((variant) => variant.primary).map((variant) => variant.exerciseId));
  family.levels = levelRange(members.filter((member) => primaryIds.has(String(member._id))).map((member) => member.difficulty));
  family.muscles = [...new Set(members.flatMap((member) => member.primaryMuscles))].sort();
  await family.save();
}

export async function regroupLibrary(): Promise<RegroupSummary> {
  const [library, used, existingFamilies] = await Promise.all([
    Exercise.find(LIBRARY_FILTER)
      .select('name primaryMuscles equipment difficulty movementType familyId familySource')
      .lean<LibraryDoc[]>(),
    coachUsedExerciseIds(),
    ExerciseFamily.find().lean<(ExerciseFamilyFields & { _id: Types.ObjectId })[]>(),
  ]);

  const coachPrimaries = existingFamilies.flatMap((family) => family.coachPrimaryIds.map(String));
  const preferred = [...coachPrimaries, ...used];

  const inputs: GroupingInput[] = [];
  let unclearPatterns = 0;
  for (const exercise of library) {
    const tagging = tagPatterns(exercise.name, exercise.primaryMuscles[0], exercise.movementType);
    if (tagging.unclear) unclearPatterns += 1;
    if (exercise.familySource === 'coach') continue;
    inputs.push({
      id: String(exercise._id),
      name: exercise.name,
      primaryMuscles: exercise.primaryMuscles,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      movementType: exercise.movementType,
      patterns: tagging.patterns,
      unclear: tagging.unclear,
    });
  }

  const grouped = groupExercises(inputs, { preferredIds: preferred });
  const byKey = new Map(existingFamilies.map((family) => [family.key, family]));
  const difficultyById = new Map(library.map((exercise) => [String(exercise._id), exercise.difficulty]));

  const familyOps: AnyBulkWriteOperation<ExerciseFamilyFields>[] = [];
  for (const family of grouped) {
    const existing = byKey.get(family.key);
    const levels = levelRange(
      family.members.filter((member) => member.primary).map((member) => difficultyById.get(member.exerciseId) ?? 'beginner'),
    );
    const autoFields: Partial<ExerciseFamilyFields> = {
      muscles: family.muscles,
      movementType: family.movementType,
      levels,
      reviewReasons: family.reviewReasons,
    };
    if (!existing || existing.source !== 'coach') autoFields.name = family.name;
    if (!existing || existing.patternSource !== 'coach') autoFields.patterns = family.patterns;
    familyOps.push({
      updateOne: {
        filter: { key: family.key },
        update: { $set: autoFields, $setOnInsert: { key: family.key, source: 'auto', patternSource: 'auto', reviewedAt: null, coachPrimaryIds: [] } },
        upsert: true,
      },
    });
  }
  if (familyOps.length > 0) await ExerciseFamily.bulkWrite(familyOps);

  const ids = new Map(
    (await ExerciseFamily.find({ key: { $in: grouped.map((family) => family.key) } }).select('key').lean()).map((family) => [
      family.key,
      family._id,
    ]),
  );
  const exerciseOps: AnyBulkWriteOperation<ExerciseDocument>[] = grouped.flatMap((family) =>
    family.members.map((member) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(member.exerciseId) },
        update: { $set: { familyId: ids.get(family.key), variant: member.variant, isPrimaryVariant: member.primary, familySource: 'auto' as const } },
      },
    })),
  );
  if (exerciseOps.length > 0) await Exercise.bulkWrite(exerciseOps);

  // Coach-built families (and auto families that also hold coach-moved exercises) choose
  // their primaries over ALL members; families left without members go.
  const mixedFamilyIds = await Exercise.distinct('familyId', { familySource: 'coach', ...LIBRARY_FILTER });
  for (const familyId of mixedFamilyIds) await refreshFamilyMembers(familyId, used);
  const liveFamilyIds = await Exercise.distinct('familyId', LIBRARY_FILTER);
  await ExerciseFamily.deleteMany({ _id: { $nin: liveFamilyIds } });

  const [families, familiesWithVariants, primaries, reviewList] = await Promise.all([
    ExerciseFamily.countDocuments(),
    Exercise.aggregate<{ n: number }>([
      { $match: { ...LIBRARY_FILTER, isPrimaryVariant: true } },
      { $group: { _id: '$familyId', variants: { $sum: 1 } } },
      { $match: { variants: { $gt: 1 } } },
      { $count: 'n' },
    ]).then((rows) => rows[0]?.n ?? 0),
    Exercise.countDocuments({ ...LIBRARY_FILTER, isPrimaryVariant: true }),
    ExerciseFamily.countDocuments({ 'reviewReasons.0': { $exists: true }, reviewedAt: null }),
  ]);
  return { exercises: library.length, families, familiesWithVariants, primaries, unclearPatterns, reviewList };
}
