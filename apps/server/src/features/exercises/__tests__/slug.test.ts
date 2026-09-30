import { describe, it, expect } from 'vitest';
import { slugify, normalizeTitleForDedupKey, buildDedupKey } from '../scripts/normalizeExercises';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Barbell Back Squat')).toBe('barbell-back-squat');
  });

  it('strips punctuation and collapses hyphens', () => {
    expect(slugify('Exercise Ball Cable Crunch - Gethin Variation')).toBe(
      'exercise-ball-cable-crunch-gethin-variation',
    );
  });

  it('trims leading/trailing hyphens produced by symbols at the edges', () => {
    expect(slugify('  -Push-Up-  ')).toBe('push-up');
  });

  it('is deterministic for the same input', () => {
    expect(slugify('Seated Cable Row')).toBe(slugify('Seated Cable Row'));
  });
});

describe('normalizeTitleForDedupKey', () => {
  it('trims, lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeTitleForDedupKey('  Seated   Cable Row!! ')).toBe('seated cable row');
  });
});

describe('buildDedupKey', () => {
  it('combines normalized title, sorted equipment, and primary muscle', () => {
    const key = buildDedupKey('seated cable row', ['cable'], 'middle_back');
    expect(key).toBe('seated cable row|cable|middle_back');
  });

  it('sorts equipment so order does not affect the key', () => {
    const a = buildDedupKey('x', ['dumbbell', 'barbell'], 'chest');
    const b = buildDedupKey('x', ['barbell', 'dumbbell'], 'chest');
    expect(a).toBe(b);
  });
});
