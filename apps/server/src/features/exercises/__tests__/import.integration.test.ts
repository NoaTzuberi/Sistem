import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join } from 'path';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './testDb';
import { runImport } from '../scripts/importExercises';
import { Exercise } from '../exercise.model';

const FIXTURE_PATH = join(__dirname, 'fixtures/sample.csv');

describe('runImport (integration, fixture CSV)', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('imports the fixture: skips invalid rows, dedupes within the batch, inserts the rest', async () => {
    const report = await runImport(FIXTURE_PATH, { writeReport: false });

    // 7 data rows: 1 blank title, 1 unmapped level -> 2 skipped; 5 normalize to records;
    // of those, "Seated Cable Row" appears twice identically -> 1 duplicate row -> 4 unique inserts.
    expect(report.totalRowsRead).toBe(7);
    expect(report.skippedRows).toBe(2);
    expect(report.validRows).toBe(5);
    expect(report.duplicateRows).toBe(1);
    expect(report.insertedRecords).toBe(4);
    expect(report.updatedRecords).toBe(0);
    expect(report.unmappedValueDetails).toHaveLength(1);
    expect(report.unmappedValueDetails[0].field).toBe('Equipment');

    const count = await Exercise.countDocuments();
    expect(count).toBe(4);

    const squat = await Exercise.findOne({ slug: 'barbell-back-squat' });
    expect(squat).not.toBeNull();
    expect(squat?.reviewStatus).toBe('imported');
  });

  it('is idempotent: a second run on the same CSV creates no new records', async () => {
    await runImport(FIXTURE_PATH, { writeReport: false });
    const countAfterFirst = await Exercise.countDocuments();

    const secondReport = await runImport(FIXTURE_PATH, { writeReport: false });
    const countAfterSecond = await Exercise.countDocuments();

    expect(countAfterSecond).toBe(countAfterFirst);
    expect(secondReport.insertedRecords).toBe(0);
    expect(secondReport.updatedRecords).toBe(countAfterFirst);
  });

  it('never overwrites a record that has already been curated (reviewed/published)', async () => {
    await runImport(FIXTURE_PATH, { writeReport: false });

    const squat = await Exercise.findOne({ slug: 'barbell-back-squat' });
    expect(squat).not.toBeNull();
    squat!.reviewStatus = 'published';
    squat!.name = 'Curated Name — Do Not Overwrite';
    await squat!.save();

    const report = await runImport(FIXTURE_PATH, { writeReport: false });
    expect(report.skippedCuratedConflicts).toBe(1);

    const stillCurated = await Exercise.findOne({ slug: 'barbell-back-squat' });
    expect(stillCurated?.name).toBe('Curated Name — Do Not Overwrite');
    expect(stillCurated?.reviewStatus).toBe('published');
  });
});
