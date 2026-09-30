import { describe, it, expect } from 'vitest';
import { dedupeWithinBatch, disambiguateSlugs } from '../scripts/importExercises';
import type { NormalizedExercise } from '../exercise.types';

function record(overrides: Partial<NormalizedExercise>): NormalizedExercise {
  return {
    slug: 'test-exercise',
    name: 'Test Exercise',
    aliases: [],
    category: ['upper_body'],
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: ['barbell'],
    difficulty: 'beginner',
    movementType: 'strength',
    instructions: { setup: '', execution: '', breathing: '' },
    source: {
      provider: 'Kaggle',
      dataset: 'niharika41298/gym-exercise-data',
      originalTitle: 'Test Exercise',
      importedAt: new Date(),
      license: null,
      sourceUrl: null,
      raw: null,
    },
    reviewStatus: 'imported',
    isActive: true,
    dedupKey: 'test exercise|barbell|chest',
    ...overrides,
  };
}

describe('dedupeWithinBatch', () => {
  it('collapses exact-duplicate dedupKeys into one record', () => {
    const rows = [record({}), record({})];
    const { unique, duplicateDetails } = dedupeWithinBatch(rows);

    expect(unique).toHaveLength(1);
    expect(duplicateDetails).toHaveLength(1);
    expect(duplicateDetails[0].skippedRowIndexes).toEqual([1]);
  });

  it('keeps the first record of a duplicate group', () => {
    const rows = [record({ name: 'First' }), record({ name: 'Second' })];
    const { unique } = dedupeWithinBatch(rows);

    expect(unique[0].name).toBe('First');
  });

  it('keeps distinct dedupKeys as separate records', () => {
    const rows = [
      record({ dedupKey: 'a' }),
      record({ dedupKey: 'b' }),
    ];
    const { unique } = dedupeWithinBatch(rows);

    expect(unique).toHaveLength(2);
  });
});

describe('disambiguateSlugs', () => {
  it('leaves non-colliding slugs untouched', () => {
    const rows = [
      record({ slug: 'barbell-deadlift', dedupKey: 'a' }),
      record({ slug: 'barbell-squat', dedupKey: 'b' }),
    ];
    const { records, renamed } = disambiguateSlugs(rows);

    expect(records.map((r) => r.slug)).toEqual(['barbell-deadlift', 'barbell-squat']);
    expect(renamed).toEqual([]);
  });

  it('disambiguates two genuinely different exercises sharing a slug, using equipment', () => {
    const rows = [
      record({ slug: 'barbell-deadlift', dedupKey: 'a', primaryMuscles: ['hamstrings'] }),
      record({ slug: 'barbell-deadlift', dedupKey: 'b', primaryMuscles: ['lower_back'] }),
    ];
    const { records, renamed } = disambiguateSlugs(rows);

    expect(records[0].slug).toBe('barbell-deadlift');
    expect(records[1].slug).toBe('barbell-deadlift-barbell');
    expect(renamed).toEqual([{ originalSlug: 'barbell-deadlift', finalSlug: 'barbell-deadlift-barbell' }]);
  });

  it('is deterministic across repeated calls on the same input order', () => {
    const rows = [
      record({ slug: 'hack-squat', dedupKey: 'a', equipment: ['barbell'] }),
      record({ slug: 'hack-squat', dedupKey: 'b', equipment: ['machine'] }),
    ];

    const first = disambiguateSlugs(rows);
    const second = disambiguateSlugs(rows);

    expect(first.records.map((r) => r.slug)).toEqual(second.records.map((r) => r.slug));
  });

  it('falls back to a numeric suffix if the equipment-based slug also collides', () => {
    const rows = [
      record({ slug: 'x', dedupKey: 'a', equipment: ['barbell'] }),
      record({ slug: 'x', dedupKey: 'b', equipment: ['barbell'], primaryMuscles: ['chest'] }),
      record({ slug: 'x', dedupKey: 'c', equipment: ['barbell'], primaryMuscles: ['triceps'] }),
    ];
    const { records } = disambiguateSlugs(rows);
    const slugs = records.map((r) => r.slug);

    expect(new Set(slugs).size).toBe(3);
  });
});
