import type { AiTraineeProfile, ExerciseFacts } from '@sistem/types';
import { EQUIPMENT_IDS } from '../../exercises/exercise.constants';
import type { Equipment, Muscle, MovementType } from '../../exercises/exercise.constants';
import { listCoachLibraryFacts } from '../../exercises/exercise.service';
import { Plan } from '../../plans/plan.model';
import {
  ALWAYS_AVAILABLE_EQUIPMENT,
  CANDIDATE_DIFFICULTIES,
  CANDIDATES_PER_FOCUS_MUSCLE,
  CANDIDATES_PER_MUSCLE,
  CARDIO_CANDIDATES,
  CARDIO_TRIGGERS,
  EXCLUDED_MUSCLES,
  MAX_CANDIDATES,
  MINOR_MUSCLES,
  MOBILITY_CANDIDATES,
  MOBILITY_TRIGGERS,
  MUSCLE_FOCUS_TO_MUSCLES,
  ONBOARDING_EQUIPMENT_TO_LIBRARY,
} from './trainingPlan.constants';

// The grounding: the model may only pick from these library exercises (by alias), chosen
// in code from her equipment, goals and focus. Nothing outside the list can come back.

export interface Candidate {
  /** 'E001' … — what the model sees and answers with. */
  alias: string;
  facts: ExerciseFacts;
}

export function aliasFor(index: number): string {
  return `E${String(index + 1).padStart(3, '0')}`;
}

export function allowedEquipment(profile: AiTraineeProfile): Set<Equipment> {
  const allowed = new Set<Equipment>(ALWAYS_AVAILABLE_EQUIPMENT);
  for (const answer of profile.equipment) {
    const mapped = ONBOARDING_EQUIPMENT_TO_LIBRARY[answer];
    if (mapped === 'all') return new Set(EQUIPMENT_IDS);
    mapped?.forEach((equipment) => allowed.add(equipment));
  }
  return allowed;
}

export function candidateMovementTypes(profile: AiTraineeProfile): MovementType[] {
  const signals = new Set([...profile.goals, ...profile.recoveryFlags]);
  const types: MovementType[] = ['strength'];
  if (MOBILITY_TRIGGERS.some((id) => signals.has(id))) types.push('mobility');
  if (CARDIO_TRIGGERS.some((id) => signals.has(id))) types.push('cardio');
  return types;
}

/**
 * Plain names first: the imported list has many branded or odd variants ("FYR2 Banded
 * Squat…", "Power snatch-"). Lower is better.
 */
function nameRank(name: string): number {
  let rank = name.length;
  if (/^[A-Z0-9]{2,}\s/.test(name)) rank += 40; // a brand / program prefix
  if (/[-–]\s*$/.test(name) || /\s[-–]\s/.test(name)) rank += 15;
  if (/\(|\)|\//.test(name)) rank += 10;
  return rank;
}

/** Coach's own picks first, then plain names; within that, one equipment type after another. */
function orderGroup(exercises: ExerciseFacts[], coachUsed: Set<string>): ExerciseFacts[] {
  const sorted = [...exercises].sort(
    (a, b) =>
      Number(coachUsed.has(b.id)) - Number(coachUsed.has(a.id)) ||
      nameRank(a.name) - nameRank(b.name) ||
      a.name.localeCompare(b.name),
  );
  const used = sorted.filter((exercise) => coachUsed.has(exercise.id));
  const rest = sorted.filter((exercise) => !coachUsed.has(exercise.id));

  // Round robin by equipment, so a full-gym trainee doesn't get ten bodyweight variants.
  const byEquipment = new Map<string, ExerciseFacts[]>();
  for (const exercise of rest) {
    const key = exercise.equipment[0] ?? 'none';
    byEquipment.set(key, [...(byEquipment.get(key) ?? []), exercise]);
  }
  const queues = [...byEquipment.values()];
  const interleaved: ExerciseFacts[] = [];
  for (let round = 0; interleaved.length < rest.length; round += 1) {
    for (const queue of queues) if (queue[round]) interleaved.push(queue[round]);
  }
  return [...used, ...interleaved];
}

/** Pure: picks and orders the candidates from the (already level / type filtered) library. */
export function selectCandidates(library: ExerciseFacts[], profile: AiTraineeProfile, coachUsed: Set<string>): Candidate[] {
  const equipment = allowedEquipment(profile);
  const usable = library.filter((exercise) => exercise.equipment.every((item) => equipment.has(item as Equipment)));

  const focus = new Set<string>(profile.muscleFocus.flatMap((id) => MUSCLE_FOCUS_TO_MUSCLES[id] ?? []));
  const strengthByMuscle = new Map<string, ExerciseFacts[]>();
  const mobility: ExerciseFacts[] = [];
  const cardio: ExerciseFacts[] = [];

  for (const exercise of usable) {
    if (exercise.movementType === 'mobility') mobility.push(exercise);
    else if (exercise.movementType === 'cardio') cardio.push(exercise);
    else {
      const muscle = exercise.primaryMuscles[0];
      if (!muscle || EXCLUDED_MUSCLES.includes(muscle as Muscle)) continue;
      strengthByMuscle.set(muscle, [...(strengthByMuscle.get(muscle) ?? []), exercise]);
    }
  }

  const picked: ExerciseFacts[] = [];
  for (const muscle of [...strengthByMuscle.keys()].sort()) {
    const share = focus.has(muscle) ? CANDIDATES_PER_FOCUS_MUSCLE : CANDIDATES_PER_MUSCLE;
    const limit = MINOR_MUSCLES.includes(muscle as Muscle) ? Math.ceil(share / 2) : share;
    picked.push(...orderGroup(strengthByMuscle.get(muscle)!, coachUsed).slice(0, limit));
  }
  picked.push(...orderGroup(mobility, coachUsed).slice(0, MOBILITY_CANDIDATES));
  picked.push(...orderGroup(cardio, coachUsed).slice(0, CARDIO_CANDIDATES));

  return picked.slice(0, MAX_CANDIDATES).map((facts, index) => ({ alias: aliasFor(index), facts }));
}

/** Every exercise this coach has put in any plan — her taste, offered first. */
async function coachUsedExerciseIds(coachId: string): Promise<Set<string>> {
  const ids = await Plan.distinct('workouts.exercises.exerciseId', { coachId });
  return new Set(ids.map(String));
}

export async function loadCandidates(profile: AiTraineeProfile, coachId: string): Promise<Candidate[]> {
  const [library, coachUsed] = await Promise.all([
    listCoachLibraryFacts({ difficulties: CANDIDATE_DIFFICULTIES, movementTypes: candidateMovementTypes(profile) }),
    coachUsedExerciseIds(coachId),
  ]);
  return selectCandidates(library, profile, coachUsed);
}
