import { Exercise } from './exercise.model';
import { scoreExercise } from './exerciseSearch';
import type {
  Category,
  Muscle,
  Equipment,
  Difficulty,
  MovementType,
  ContentTier,
  Mechanic,
  ForceType,
  ExerciseGoal,
} from './exercise.constants';
import type { ExerciseMedia } from './exercise.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Any consumer — the public list endpoint today, a future AI Workout Agent
 * tomorrow — filters through this same shape. Every field is optional and
 * single-value, matching the existing filter pattern; goal/mechanic/
 * forceType/isUnilateral are the dimensions the (not-yet-built) Workout
 * Agent is expected to reason over per docs/05_AI_AGENT_SPEC.md.
 */
export interface ListExercisesParams {
  page?: number;
  limit?: number;
  category?: Category;
  muscle?: Muscle;
  equipment?: Equipment;
  difficulty?: Difficulty;
  movementType?: MovementType;
  goal?: ExerciseGoal;
  mechanic?: Mechanic;
  forceType?: ForceType;
  isUnilateral?: boolean;
  search?: string;
}

export interface PublicExercise {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: Category[];
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  difficulty: Difficulty;
  movementType: MovementType;
  instructions: { setup: string; execution: string; breathing: string };
  commonMistakes: string[];
  tips: string[];
  media: ExerciseMedia;
  contentTier: ContentTier;
  goals?: ExerciseGoal[];
  mechanic?: Mechanic;
  forceType?: ForceType;
  isUnilateral?: boolean;
}

export interface PaginatedExercises {
  items: PublicExercise[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ExerciseNotFoundError extends Error {}

interface ExerciseLeanDoc {
  _id: unknown;
  slug: string;
  name: string;
  aliases: string[];
  category: Category[];
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  difficulty: Difficulty;
  movementType: MovementType;
  instructions: { setup: string; execution: string; breathing: string };
  commonMistakes: string[];
  tips: string[];
  media: ExerciseMedia;
  contentTier: ContentTier;
  goals?: ExerciseGoal[];
  mechanic?: Mechanic;
  forceType?: ForceType;
  isUnilateral?: boolean;
}

/**
 * Strips internal workflow/source fields (reviewStatus, isActive, source —
 * including source.raw — and the progressions/regressions/variations/
 * alternatives ObjectId refs) from the public API response. contentTier IS
 * exposed: it's product-facing (a curated-content badge), not internal metadata.
 */
function toPublicExercise(doc: ExerciseLeanDoc): PublicExercise {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    aliases: doc.aliases,
    category: doc.category,
    primaryMuscles: doc.primaryMuscles,
    secondaryMuscles: doc.secondaryMuscles,
    equipment: doc.equipment,
    difficulty: doc.difficulty,
    movementType: doc.movementType,
    instructions: doc.instructions,
    commonMistakes: doc.commonMistakes,
    tips: doc.tips,
    media: doc.media,
    contentTier: doc.contentTier,
    goals: doc.goals,
    mechanic: doc.mechanic,
    forceType: doc.forceType,
    isUnilateral: doc.isUnilateral,
  };
}

function buildPublicFilter(params: ListExercisesParams): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    reviewStatus: 'published',
    isActive: true,
  };

  if (params.category) filter.category = params.category;
  if (params.muscle) filter.primaryMuscles = params.muscle;
  if (params.equipment) filter.equipment = params.equipment;
  if (params.difficulty) filter.difficulty = params.difficulty;
  if (params.movementType) filter.movementType = params.movementType;
  if (params.goal) filter.goals = params.goal;
  if (params.mechanic) filter.mechanic = params.mechanic;
  if (params.forceType) filter.forceType = params.forceType;
  if (params.isUnilateral !== undefined) filter.isUnilateral = params.isUnilateral;

  return filter;
}

/**
 * Sorted so that, within whatever the filter already deems relevant,
 * 'enhanced' (curated) exercises surface first ('enhanced' < 'standard'
 * lexicographically, so ascending sort naturally puts them first — no
 * aggregation needed). This is the entire "prioritization" mechanism: the
 * filter decides relevance, the sort just orders within it. An exercise
 * never appears here unless it already matched the caller's actual filters,
 * so an enhanced exercise is never forced into an irrelevant result.
 */
export async function listPublicExercises(
  params: ListExercisesParams,
): Promise<PaginatedExercises> {
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const filter = buildPublicFilter(params);

  if (params.search) {
    return listPublicExercisesWithSearch(filter, params.search, page, limit);
  }

  const [docs, total] = await Promise.all([
    Exercise.find(filter)
      .sort({ contentTier: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ExerciseLeanDoc[]>(),
    Exercise.countDocuments(filter),
  ]);

  return {
    items: docs.map(toPublicExercise),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Search path: partial/multi-word matching and typo tolerance both need
 * scoring text MongoDB's query language can't express directly, so this
 * scores every candidate in Node instead of paginating in Mongo. Fine at
 * today's scale — see exerciseSearch.ts for why. Structural filters
 * (muscle/equipment/etc.) still narrow the candidate set in Mongo first;
 * only the search term itself is scored/ranked/paginated in memory.
 */
async function listPublicExercisesWithSearch(
  filter: Record<string, unknown>,
  search: string,
  page: number,
  limit: number,
): Promise<PaginatedExercises> {
  const candidates = await Exercise.find(filter).lean<ExerciseLeanDoc[]>();

  const scored = candidates
    .map((doc) => ({ doc, score: scoreExercise(search, doc.name, doc.aliases) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.doc.contentTier !== b.doc.contentTier) return a.doc.contentTier === 'enhanced' ? -1 : 1;
      return a.doc.name.localeCompare(b.doc.name);
    });

  const total = scored.length;
  const start = (page - 1) * limit;
  const pageItems = scored.slice(start, start + limit).map((entry) => entry.doc);

  return {
    items: pageItems.map(toPublicExercise),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPublicExerciseBySlug(slug: string): Promise<PublicExercise> {
  const doc = await Exercise.findOne({ slug, reviewStatus: 'published', isActive: true }).lean<ExerciseLeanDoc>();
  if (!doc) {
    throw new ExerciseNotFoundError('Exercise not found.');
  }
  return toPublicExercise(doc);
}

/**
 * RAG-eligibility filter, per docs/06_RAG_KNOWLEDGE_PLAN.md: only published,
 * active, reviewed records are eligible. No vector ingestion happens here —
 * this just exposes the query for a future RAG pipeline to consume.
 */
export async function listRagEligibleExercises() {
  return Exercise.find({ reviewStatus: 'published', isActive: true }).lean();
}
