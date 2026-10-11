import type { AiTraineeProfile, PatternId, VariantId } from '@sistem/types';
import type { Difficulty, Equipment } from '../../exercises/exercise.constants';
import { Exercise } from '../../exercises/exercise.model';
import { ExerciseFamily } from '../../exerciseFamilies/exerciseFamily.model';
import { plainNameRank } from '../../exerciseFamilies/exerciseFamilyGrouping';
import { Plan } from '../../plans/plan.model';
import { equipmentForAnswers, exerciseAllowed, levelsForExperience, type TraineeExerciseAccess } from '../../trainingSplits/traineeExerciseAccess';
import {
  CANDIDATES_PER_FOCUS_PATTERN,
  CANDIDATES_PER_PATTERN,
  LOW_IMPACT_EXCLUDED_PATTERNS,
  MAX_CANDIDATES,
  MINOR_PATTERNS,
  MUSCLE_FOCUS_TO_PATTERNS,
} from './trainingPlan.constants';

// The grounding (Phase 12b): the model picks exercise FAMILIES by alias (F001…) and one of the
// variants listed for each — only variants she has the equipment and level for, and only
// families whose movement pattern fits a slot of the splits on offer. Chosen in code.

export interface CandidateVariant {
  variant: VariantId;
  /** The variant's primary exercise: what goes into the plan. */
  exerciseId: string;
  name: string;
  difficulty: string;
  equipment: string[];
}

export interface FamilyCandidate {
  /** 'F001' … — what the model sees and answers with. */
  alias: string;
  familyId: string;
  name: string;
  patterns: PatternId[];
  muscles: string[];
  movementType: string;
  variants: CandidateVariant[];
}

/** A family before selection (no alias yet). */
export type FamilyPoolEntry = Omit<FamilyCandidate, 'alias'>;

export function aliasFor(index: number): string {
  return `F${String(index + 1).padStart(3, '0')}`;
}

export function allowedEquipment(profile: Pick<AiTraineeProfile, 'equipment'>): Set<Equipment> {
  return equipmentForAnswers(profile.equipment);
}

export function accessForProfile(profile: Pick<AiTraineeProfile, 'equipment' | 'experience'>): TraineeExerciseAccess {
  return { equipment: allowedEquipment(profile), levels: levelsForExperience(profile.experience) };
}

/** Patterns that get the larger share: the ones that train her focus muscles. */
export function focusPatterns(profile: Pick<AiTraineeProfile, 'muscleFocus'>): Set<PatternId> {
  return new Set(profile.muscleFocus.flatMap((id) => MUSCLE_FOCUS_TO_PATTERNS[id] ?? []));
}

/**
 * Pure: per needed pattern (in the slots' order) the best families not taken yet — the coach's
 * own picks first, then plain names. One family may fit several slots; it is listed once.
 */
export function selectFamilyCandidates(
  pool: FamilyPoolEntry[],
  neededPatterns: PatternId[],
  profile: Pick<AiTraineeProfile, 'muscleFocus' | 'recoveryFlags'>,
  coachUsedFamilies: Set<string>,
): FamilyCandidate[] {
  const focus = focusPatterns(profile);
  const lowImpact = profile.recoveryFlags.includes('prefers_low_impact');
  const usable = pool.filter(
    (family) => family.variants.length > 0 && !(lowImpact && family.patterns.some((p) => LOW_IMPACT_EXCLUDED_PATTERNS.includes(p))),
  );
  const rank = (a: FamilyPoolEntry, b: FamilyPoolEntry) =>
    Number(coachUsedFamilies.has(b.familyId)) - Number(coachUsedFamilies.has(a.familyId)) ||
    b.variants.length - a.variants.length ||
    plainNameRank(a.name) - plainNameRank(b.name) ||
    a.name.localeCompare(b.name);

  const picked = new Map<string, FamilyPoolEntry>();
  for (const pattern of neededPatterns) {
    const share = focus.has(pattern) ? CANDIDATES_PER_FOCUS_PATTERN : MINOR_PATTERNS.includes(pattern) ? Math.ceil(CANDIDATES_PER_PATTERN / 2) : CANDIDATES_PER_PATTERN;
    const already = [...picked.values()].filter((family) => family.patterns.includes(pattern)).length;
    const fresh = usable.filter((family) => family.patterns.includes(pattern) && !picked.has(family.familyId)).sort(rank);
    for (const family of fresh.slice(0, Math.max(0, share - already))) {
      if (picked.size >= MAX_CANDIDATES) break;
      picked.set(family.familyId, family);
    }
  }
  return [...picked.values()].map((family, index) => ({ ...family, alias: aliasFor(index) }));
}

/** Every family with its primaries she can do (her equipment and levels). */
export async function loadFamilyPool(access: TraineeExerciseAccess): Promise<FamilyPoolEntry[]> {
  const [families, primaries] = await Promise.all([
    // Unchecked combos (unclear patterns) are never offered — the coach reviews them first.
    ExerciseFamily.find({ 'patterns.0': { $exists: true }, $nor: [{ reviewReasons: 'unclear_pattern', reviewedAt: null }] })
      .select('name patterns muscles movementType')
      .lean(),
    Exercise.find({ isActive: true, reviewStatus: { $ne: 'rejected' }, isPrimaryVariant: true })
      .select('name equipment difficulty familyId variant')
      .lean(),
  ]);
  const variantsByFamily = new Map<string, CandidateVariant[]>();
  for (const exercise of primaries) {
    if (!exercise.familyId || !exerciseAllowed({ equipment: exercise.equipment, difficulty: exercise.difficulty }, access)) continue;
    const id = String(exercise.familyId);
    variantsByFamily.set(id, [
      ...(variantsByFamily.get(id) ?? []),
      {
        variant: exercise.variant ?? 'other',
        exerciseId: String(exercise._id),
        name: exercise.name,
        difficulty: exercise.difficulty as Difficulty,
        equipment: exercise.equipment,
      },
    ]);
  }
  return families.map((family) => ({
    familyId: String(family._id),
    name: family.name,
    patterns: family.patterns as PatternId[],
    muscles: family.muscles,
    movementType: family.movementType,
    variants: variantsByFamily.get(String(family._id)) ?? [],
  }));
}

/** Families of every exercise this coach has put in any plan — her taste, offered first. */
export async function coachUsedFamilyIds(coachId: string): Promise<Set<string>> {
  const exerciseIds = await Plan.distinct('workouts.exercises.exerciseId', { coachId });
  const familyIds = await Exercise.distinct('familyId', { _id: { $in: exerciseIds } });
  return new Set(familyIds.filter(Boolean).map(String));
}
