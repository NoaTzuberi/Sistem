import { describe, it, expect } from 'vitest';
import { validateExerciseListQuery, validateSlugParam } from '../exercise.validation';

describe('validateExerciseListQuery', () => {
  it('accepts an empty query', () => {
    expect(validateExerciseListQuery({})).toBeNull();
  });

  it('accepts valid filters', () => {
    expect(
      validateExerciseListQuery({
        page: '1',
        limit: '20',
        muscle: 'chest',
        equipment: 'barbell',
        difficulty: 'beginner',
        movementType: 'strength',
        search: 'squat',
      }),
    ).toBeNull();
  });

  it('rejects a non-integer page', () => {
    expect(validateExerciseListQuery({ page: 'abc' })).not.toBeNull();
  });

  it('rejects a limit above the max', () => {
    expect(validateExerciseListQuery({ limit: '500' })).not.toBeNull();
  });

  it('rejects an unrecognized muscle value', () => {
    expect(validateExerciseListQuery({ muscle: 'wings' })).not.toBeNull();
  });

  it('rejects an unrecognized equipment value', () => {
    expect(validateExerciseListQuery({ equipment: 'trebuchet' })).not.toBeNull();
  });

  it('rejects an unrecognized difficulty value', () => {
    expect(validateExerciseListQuery({ difficulty: 'godlike' })).not.toBeNull();
  });

  it('rejects an unrecognized movementType value', () => {
    expect(validateExerciseListQuery({ movementType: 'teleportation' })).not.toBeNull();
  });
});

describe('validateSlugParam', () => {
  it('accepts a non-empty string', () => {
    expect(validateSlugParam('barbell-back-squat')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(validateSlugParam('')).not.toBeNull();
  });

  it('rejects a non-string', () => {
    expect(validateSlugParam(undefined)).not.toBeNull();
  });
});
