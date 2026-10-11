import {
  SOURCE_LEVEL_TO_DIFFICULTY,
  SOURCE_TYPE_TO_MOVEMENT_TYPE,
  SOURCE_EQUIPMENT_TO_EQUIPMENT,
  SOURCE_BODY_PART_TO_MUSCLE,
  MUSCLE_TO_CATEGORIES,
} from '../exercise.constants';
import type { Category, Muscle, Equipment } from '../exercise.constants';
import { cleanExerciseName } from '../exerciseName';
import type { RawExerciseRow, NormalizedExercise, RowIssue, NormalizeResult } from '../exercise.types';

const KAGGLE_DATASET_ID = 'niharika41298/gym-exercise-data';
const KAGGLE_DATASET_URL = 'https://www.kaggle.com/datasets/niharika41298/gym-exercise-data';
// License could not be confirmed, so only plain facts are imported — never
// descriptions, tips, instructions or ratings (docs/THIRD_PARTY_CONTENT.md).
export const KAGGLE_LICENSE = 'unconfirmed — facts only';

/** Deterministic, ASCII-safe, URL-friendly slug from an exercise name. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Normalized title for dedup comparisons: trim, lowercase, strip punctuation, collapse whitespace. */
export function normalizeTitleForDedupKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dedup key: normalized title + equipment + primary muscle, per the agreed dedup rule. */
export function buildDedupKey(
  normalizedTitle: string,
  equipment: string[],
  primaryMuscle: string | undefined,
): string {
  return [normalizedTitle, [...equipment].sort().join(','), primaryMuscle ?? ''].join('|');
}

type NormalizeRowResult =
  | { record: NormalizedExercise; unmapped: RowIssue[] }
  | { skipped: RowIssue };

export function normalizeRow(
  row: RawExerciseRow,
  rowIndex: number,
  importedAt: Date,
): NormalizeRowResult {
  const title = (row.Title ?? '').trim();
  if (!title) {
    return { skipped: { rowIndex, title: '', field: 'Title', value: '', reason: 'Missing title' } };
  }

  const level = (row.Level ?? '').trim();
  const difficulty = SOURCE_LEVEL_TO_DIFFICULTY[level];
  if (!difficulty) {
    return {
      skipped: { rowIndex, title, field: 'Level', value: level, reason: 'Unmapped or missing difficulty level' },
    };
  }

  const type = (row.Type ?? '').trim();
  const movementType = SOURCE_TYPE_TO_MOVEMENT_TYPE[type];
  if (!movementType) {
    return {
      skipped: { rowIndex, title, field: 'Type', value: type, reason: 'Unmapped or missing movement type' },
    };
  }

  const unmapped: RowIssue[] = [];

  const equipmentRaw = (row.Equipment ?? '').trim();
  let equipment: Equipment[] = [];
  if (equipmentRaw) {
    const mapped = SOURCE_EQUIPMENT_TO_EQUIPMENT[equipmentRaw];
    if (mapped) {
      equipment = [mapped];
    } else {
      unmapped.push({
        rowIndex,
        title,
        field: 'Equipment',
        value: equipmentRaw,
        reason: 'No controlled-vocabulary mapping',
      });
    }
  }

  const bodyPartRaw = (row.BodyPart ?? '').trim();
  let primaryMuscles: Muscle[] = [];
  let category: Category[] = [];
  if (bodyPartRaw) {
    const muscle = SOURCE_BODY_PART_TO_MUSCLE[bodyPartRaw];
    if (muscle) {
      primaryMuscles = [muscle];
      category = MUSCLE_TO_CATEGORIES[muscle] ?? [];
    } else {
      unmapped.push({
        rowIndex,
        title,
        field: 'BodyPart',
        value: bodyPartRaw,
        reason: 'No controlled-vocabulary mapping',
      });
    }
  }

  const normalizedTitle = normalizeTitleForDedupKey(title);
  const slug = slugify(title);
  const dedupKey = buildDedupKey(normalizedTitle, equipment, primaryMuscles[0]);

  const record: NormalizedExercise = {
    slug,
    // Display name without the source program prefix; the slug stays from the title (stable ids).
    name: cleanExerciseName(title),
    aliases: [],
    category,
    primaryMuscles,
    secondaryMuscles: [],
    equipment,
    difficulty,
    movementType,
    instructions: { setup: '', execution: '', breathing: '' },
    source: {
      provider: 'Kaggle',
      dataset: KAGGLE_DATASET_ID,
      originalTitle: title,
      importedAt,
      license: KAGGLE_LICENSE,
      sourceUrl: KAGGLE_DATASET_URL,
      // Only the factual columns, never the whole row (which carries Desc/Rating text).
      raw: { Title: title, Type: type, BodyPart: bodyPartRaw, Equipment: equipmentRaw, Level: level },
    },
    reviewStatus: 'imported',
    isActive: true,
    dedupKey,
  };

  return { record, unmapped };
}

export function normalizeRows(rows: RawExerciseRow[], importedAt: Date = new Date()): NormalizeResult {
  const records: NormalizedExercise[] = [];
  const skippedRows: RowIssue[] = [];
  const unmappedValues: RowIssue[] = [];

  rows.forEach((row, index) => {
    const result = normalizeRow(row, index, importedAt);
    if ('skipped' in result) {
      skippedRows.push(result.skipped);
      return;
    }
    records.push(result.record);
    unmappedValues.push(...result.unmapped);
  });

  return { records, skippedRows, unmappedValues };
}
