import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { connectDatabase } from '../../../config/database';
import { Exercise } from '../exercise.model';
import { normalizeRows } from './normalizeExercises';
import { regroupLibrary } from '../../exerciseFamilies/exerciseFamilyGrouping.service';
import type { RawExerciseRow, NormalizedExercise, RowIssue } from '../exercise.types';
import mongoose from 'mongoose';

const DEFAULT_CSV_PATH = join(
  __dirname,
  '../../../../data/raw/gym-exercise-data/megaGymDataset.csv',
);
const REPORT_DIR = join(__dirname, '../../../../data/processed');

interface ImportReport {
  runAt: string;
  csvPath: string;
  totalRowsRead: number;
  validRows: number;
  skippedRows: number;
  duplicateRows: number;
  insertedRecords: number;
  updatedRecords: number;
  skippedCuratedConflicts: number;
  recordsAwaitingReview: number;
  missingFieldCounts: {
    title: number;
    bodyPart: number;
    equipment: number;
    level: number;
  };
  skippedRowDetails: RowIssue[];
  unmappedValueDetails: RowIssue[];
  duplicateDetails: { dedupKey: string; keptRowIndex: number; skippedRowIndexes: number[] }[];
  renamedSlugDetails: { originalSlug: string; finalSlug: string }[];
  exampleErrors: RowIssue[];
}

export function dedupeWithinBatch(records: NormalizedExercise[]) {
  const kept = new Map<string, NormalizedExercise>();
  const duplicateDetails: ImportReport['duplicateDetails'] = [];
  const dedupIndex = new Map<string, number[]>();

  records.forEach((record, index) => {
    const existing = kept.get(record.dedupKey);
    if (!existing) {
      kept.set(record.dedupKey, record);
      dedupIndex.set(record.dedupKey, [index]);
      return;
    }

    dedupIndex.get(record.dedupKey)!.push(index);
  });

  for (const [dedupKey, indexes] of dedupIndex.entries()) {
    if (indexes.length > 1) {
      duplicateDetails.push({
        dedupKey,
        keptRowIndex: indexes[0],
        skippedRowIndexes: indexes.slice(1),
      });
    }
  }

  return { unique: Array.from(kept.values()), duplicateDetails };
}

/**
 * Two records can have different dedupKeys (genuinely different exercises —
 * different equipment/muscle) yet the same name-derived slug (e.g. "Barbell
 * Deadlift" filed under both Hamstrings and Lower Back). Since slug is the
 * unique upsert key, an unresolved collision would silently overwrite one
 * record with the other. Deterministic given a stable row order, so this
 * stays idempotent across re-runs of the same CSV.
 */
export function disambiguateSlugs(records: NormalizedExercise[]): {
  records: NormalizedExercise[];
  renamed: { originalSlug: string; finalSlug: string }[];
} {
  const seenSlugs = new Set<string>();
  const renamed: { originalSlug: string; finalSlug: string }[] = [];

  const result = records.map((record) => {
    if (!seenSlugs.has(record.slug)) {
      seenSlugs.add(record.slug);
      return record;
    }

    const disambiguator = record.equipment[0] ?? record.primaryMuscles[0] ?? 'variant';
    let candidateSlug = `${record.slug}-${disambiguator}`;
    let counter = 2;
    while (seenSlugs.has(candidateSlug)) {
      candidateSlug = `${record.slug}-${disambiguator}-${counter}`;
      counter += 1;
    }

    seenSlugs.add(candidateSlug);
    renamed.push({ originalSlug: record.slug, finalSlug: candidateSlug });
    return { ...record, slug: candidateSlug };
  });

  return { records: result, renamed };
}

async function upsertRecord(record: NormalizedExercise): Promise<'inserted' | 'updated' | 'curated-skip'> {
  const existing = await Exercise.findOne({ slug: record.slug });

  if (!existing) {
    await Exercise.create({
      slug: record.slug,
      name: record.name,
      aliases: record.aliases,
      category: record.category,
      primaryMuscles: record.primaryMuscles,
      secondaryMuscles: record.secondaryMuscles,
      equipment: record.equipment,
      difficulty: record.difficulty,
      movementType: record.movementType,
      instructions: record.instructions,
      source: record.source,
      reviewStatus: record.reviewStatus,
      isActive: record.isActive,
    });
    return 'inserted';
  }

  if (existing.reviewStatus === 'published' || existing.reviewStatus === 'reviewed') {
    return 'curated-skip';
  }

  // Only refresh source-derived fields; never touch reviewStatus/isActive on an existing record.
  existing.name = record.name;
  existing.category = record.category;
  existing.primaryMuscles = record.primaryMuscles;
  existing.equipment = record.equipment;
  existing.difficulty = record.difficulty;
  existing.movementType = record.movementType;
  existing.instructions = record.instructions;
  existing.source = record.source;
  await existing.save();
  return 'updated';
}

export async function runImport(
  csvPath: string = DEFAULT_CSV_PATH,
  options: { writeReport?: boolean } = {},
): Promise<ImportReport> {
  const { writeReport = true } = options;
  const csvContent = readFileSync(csvPath, 'utf-8');
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true }) as RawExerciseRow[];

  const { records, skippedRows, unmappedValues } = normalizeRows(rows);
  const { unique, duplicateDetails } = dedupeWithinBatch(records);
  const { records: disambiguated, renamed: renamedSlugDetails } = disambiguateSlugs(unique);

  let inserted = 0;
  let updated = 0;
  let curatedSkips = 0;

  for (const record of disambiguated) {
    const outcome = await upsertRecord(record);
    if (outcome === 'inserted') inserted += 1;
    else if (outcome === 'updated') updated += 1;
    else curatedSkips += 1;
  }

  const missingFieldCounts = {
    title: rows.filter((r) => !(r.Title ?? '').trim()).length,
    bodyPart: rows.filter((r) => !(r.BodyPart ?? '').trim()).length,
    equipment: rows.filter((r) => !(r.Equipment ?? '').trim()).length,
    level: rows.filter((r) => !(r.Level ?? '').trim()).length,
  };

  const duplicateRowCount = duplicateDetails.reduce((sum, d) => sum + d.skippedRowIndexes.length, 0);

  const report: ImportReport = {
    runAt: new Date().toISOString(),
    csvPath,
    totalRowsRead: rows.length,
    validRows: records.length,
    skippedRows: skippedRows.length,
    duplicateRows: duplicateRowCount,
    insertedRecords: inserted,
    updatedRecords: updated,
    skippedCuratedConflicts: curatedSkips,
    recordsAwaitingReview: inserted + updated,
    missingFieldCounts,
    skippedRowDetails: skippedRows,
    unmappedValueDetails: unmappedValues,
    duplicateDetails,
    renamedSlugDetails,
    exampleErrors: skippedRows.slice(0, 10),
  };

  if (writeReport) {
    mkdirSync(REPORT_DIR, { recursive: true });
    const reportPath = join(REPORT_DIR, `import-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  return report;
}

async function main() {
  await connectDatabase();
  try {
    const report = await runImport();
    console.log(JSON.stringify(report, null, 2));
    // Phase 12b: new / renamed exercises get their patterns and family right away.
    console.log(JSON.stringify(await regroupLibrary(), null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Import failed:', error);
    process.exitCode = 1;
  });
}
