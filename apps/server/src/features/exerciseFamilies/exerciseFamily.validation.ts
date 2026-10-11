import { Types } from 'mongoose';
import type { PatternId, UpdateExerciseFamilyPayload } from '@sistem/types';
import { DIFFICULTY_IDS, PATTERN_IDS, type Difficulty } from '../exercises/exercise.constants';
import { msg, type ServerMessage } from '../../i18n';
import { MAX_LIMIT, type FamilySearchInput } from './exerciseFamily.service';

const NAME_MAX = 80;
const SEARCH_MAX = 100;
const REVIEW_FILTERS = ['needed', 'unclear', 'reviewed'] as const;

type Parsed<T> = { value: T; error?: undefined } | { value?: undefined; error: ServerMessage };

function list(value: unknown): string[] | null {
  if (value === undefined || value === '') return [];
  if (typeof value !== 'string') return null;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function positiveInt(value: unknown, max: number): number | null | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
}

/** Query of GET /coach/exercise-families (the traineeId is checked against the coach in the controller). */
export function parseFamilySearchQuery(query: Record<string, unknown>): Parsed<FamilySearchInput> {
  const invalid = { error: msg('family_query_invalid') };
  const patterns = list(query.patterns);
  const levels = list(query.levels);
  if (!patterns || !patterns.every((p) => PATTERN_IDS.includes(p as PatternId))) return invalid;
  if (!levels || !levels.every((l) => DIFFICULTY_IDS.includes(l as Difficulty))) return invalid;
  if (query.search !== undefined && (typeof query.search !== 'string' || query.search.length > SEARCH_MAX)) return invalid;
  for (const key of ['workoutType', 'slotId'] as const) {
    if (query[key] !== undefined && (typeof query[key] !== 'string' || !/^[a-z0-9_]{1,40}$/.test(query[key] as string))) return invalid;
  }
  if (query.traineeId !== undefined && (typeof query.traineeId !== 'string' || !Types.ObjectId.isValid(query.traineeId))) return invalid;
  if (query.equipmentOnly !== undefined && query.equipmentOnly !== 'true' && query.equipmentOnly !== 'false') return invalid;
  if (query.review !== undefined && !REVIEW_FILTERS.includes(query.review as (typeof REVIEW_FILTERS)[number])) return invalid;
  const page = positiveInt(query.page, 10_000);
  const limit = positiveInt(query.limit, MAX_LIMIT);
  if (page === null || limit === null) return invalid;
  return {
    value: {
      search: query.search as string | undefined,
      workoutType: query.workoutType as string | undefined,
      slotId: query.slotId as string | undefined,
      patterns: patterns as PatternId[],
      levels: levels as Difficulty[],
      traineeId: query.traineeId as string | undefined,
      equipmentOnly: query.equipmentOnly === undefined ? undefined : query.equipmentOnly === 'true',
      review: query.review as FamilySearchInput['review'],
      page,
      limit,
    },
  };
}

export function parseUpdateFamilyPayload(body: unknown): Parsed<UpdateExerciseFamilyPayload> {
  if (typeof body !== 'object' || body === null) return { error: msg('invalid_body') };
  const { name, patterns, reviewed } = body as Record<string, unknown>;
  const value: UpdateExerciseFamilyPayload = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > NAME_MAX) return { error: msg('family_name_invalid') };
    value.name = name.trim();
  }
  if (patterns !== undefined) {
    if (!Array.isArray(patterns) || !patterns.every((p) => PATTERN_IDS.includes(p as PatternId))) return { error: msg('family_patterns_invalid') };
    value.patterns = [...new Set(patterns as PatternId[])];
  }
  if (reviewed !== undefined) {
    if (typeof reviewed !== 'boolean') return { error: msg('invalid_body') };
    value.reviewed = reviewed;
  }
  if (Object.keys(value).length === 0) return { error: msg('family_update_empty') };
  return { value };
}

export function parseIdList(value: unknown): string[] | null {
  return Array.isArray(value) && value.length > 0 && value.every((id) => typeof id === 'string' && Types.ObjectId.isValid(id)) ? (value as string[]) : null;
}
