import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from './testDb';
import { Exercise } from '../exercise.model';
import { listPublicExercises, getPublicExerciseBySlug, ExerciseNotFoundError } from '../exercise.service';
import type { ExerciseDocument } from '../exercise.types';

function baseExerciseDoc(overrides: Partial<ExerciseDocument>): Partial<ExerciseDocument> {
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
    commonMistakes: [],
    tips: [],
    media: { image: null, gif: null, video: null },
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
    ...overrides,
  };
}

describe('public exercise API', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('only returns published + active exercises from the list endpoint', async () => {
    await Exercise.create(baseExerciseDoc({ slug: 'published-one', reviewStatus: 'published' }));
    await Exercise.create(baseExerciseDoc({ slug: 'imported-only', reviewStatus: 'imported' }));
    await Exercise.create(baseExerciseDoc({ slug: 'reviewed-only', reviewStatus: 'reviewed' }));
    await Exercise.create(
      baseExerciseDoc({ slug: 'inactive-published', reviewStatus: 'published', isActive: false }),
    );

    const result = await listPublicExercises({});

    expect(result.total).toBe(1);
    expect(result.items.map((e) => e.slug)).toEqual(['published-one']);
  });

  it('does not expose internal source metadata or review fields', async () => {
    await Exercise.create(baseExerciseDoc({ slug: 'published-one', reviewStatus: 'published' }));

    const result = await listPublicExercises({});
    const exercise = result.items[0] as unknown as Record<string, unknown>;

    expect(exercise.source).toBeUndefined();
    expect(exercise.reviewStatus).toBeUndefined();
    expect(exercise.isActive).toBeUndefined();
    expect(exercise.attribution).toBeUndefined();
  });

  it('getPublicExerciseBySlug returns a published exercise', async () => {
    await Exercise.create(baseExerciseDoc({ slug: 'published-one', reviewStatus: 'published' }));

    const exercise = await getPublicExerciseBySlug('published-one');
    expect(exercise.slug).toBe('published-one');
  });

  it('getPublicExerciseBySlug throws for a non-published exercise', async () => {
    await Exercise.create(baseExerciseDoc({ slug: 'imported-only', reviewStatus: 'imported' }));

    await expect(getPublicExerciseBySlug('imported-only')).rejects.toBeInstanceOf(
      ExerciseNotFoundError,
    );
  });

  it('filters by muscle, equipment, difficulty, and movementType', async () => {
    await Exercise.create(
      baseExerciseDoc({
        slug: 'chest-barbell',
        reviewStatus: 'published',
        primaryMuscles: ['chest'],
        equipment: ['barbell'],
        difficulty: 'beginner',
        movementType: 'strength',
      }),
    );
    await Exercise.create(
      baseExerciseDoc({
        slug: 'legs-dumbbell',
        reviewStatus: 'published',
        primaryMuscles: ['quadriceps'],
        equipment: ['dumbbell'],
        difficulty: 'advanced',
        movementType: 'strength',
      }),
    );

    const result = await listPublicExercises({ muscle: 'quadriceps', equipment: 'dumbbell' });
    expect(result.items.map((e) => e.slug)).toEqual(['legs-dumbbell']);
  });

  it('searches by name', async () => {
    await Exercise.create(
      baseExerciseDoc({ slug: 'barbell-back-squat', reviewStatus: 'published', name: 'Barbell Back Squat' }),
    );
    await Exercise.create(
      baseExerciseDoc({ slug: 'push-up', reviewStatus: 'published', name: 'Push-Up' }),
    );

    const result = await listPublicExercises({ search: 'squat' });
    expect(result.items.map((e) => e.slug)).toEqual(['barbell-back-squat']);
  });

  // RepDB (the only 'enhanced' source) is gone, so every record is 'standard':
  // the contentTier sort must fall through to a plain name order.
  it('sorts the list by name when every exercise is standard tier', async () => {
    for (const name of ['Squat', 'Bench Press', 'Deadlift']) {
      await Exercise.create(
        baseExerciseDoc({ slug: name.toLowerCase().replace(' ', '-'), name, reviewStatus: 'published' }),
      );
    }

    const result = await listPublicExercises({});
    expect(result.items.map((e) => e.name)).toEqual(['Bench Press', 'Deadlift', 'Squat']);
    expect(result.items.every((e) => e.contentTier === 'standard')).toBe(true);
  });

  it('breaks equal search scores by name when every exercise is standard tier', async () => {
    for (const name of ['Squat Press', 'Squat Jump']) {
      await Exercise.create(
        baseExerciseDoc({ slug: name.toLowerCase().replace(' ', '-'), name, reviewStatus: 'published' }),
      );
    }

    const result = await listPublicExercises({ search: 'squat' });
    expect(result.items.map((e) => e.name)).toEqual(['Squat Jump', 'Squat Press']);
  });
});
