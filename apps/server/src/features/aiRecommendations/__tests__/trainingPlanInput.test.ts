import { describe, it, expect } from 'vitest';
import type { AiTraineeProfile, ExerciseFacts } from '@sistem/types';
import { ageInYears, buildKnowledgeQuery, buildTraineeProfile, scrubFreeText } from '../trainingPlan/trainingPlanProfile';
import { aliasFor, allowedEquipment, candidateMovementTypes, selectCandidates } from '../trainingPlan/trainingPlanCandidates';
import { buildTrainingPlanSchema, buildTrainingPlanUserMessage } from '../trainingPlan/trainingPlanPrompt';
import { FREE_TEXT_MAX_LENGTH, MAX_CANDIDATES } from '../trainingPlan/trainingPlan.constants';

// Phase 12: what the model is told about a trainee (minimized), and which library
// exercises it may choose from (chosen in code).

const NOW = new Date('2026-10-07T12:00:00Z');

function profile(overrides: Partial<AiTraineeProfile> = {}): AiTraineeProfile {
  return {
    goals: ['build_muscle'],
    trainingDays: { min: 3, max: 4, flexible: true },
    preferredActivities: [],
    muscleFocus: [],
    equipment: ['full_gym'],
    recoveryFlags: [],
    notes: {},
    ...overrides,
  };
}

let nextId = 0;
function exercise(name: string, fields: Partial<ExerciseFacts> = {}): ExerciseFacts {
  nextId += 1;
  return {
    id: `id${nextId}`,
    name,
    primaryMuscles: ['quadriceps'],
    equipment: ['barbell'],
    difficulty: 'beginner',
    movementType: 'strength',
    ...fields,
  };
}

describe('scrubFreeText', () => {
  it('removes emails and phone numbers', () => {
    expect(scrubFreeText('Write me at maya.t@example.com or call 054-123-4567')).toBe(
      'Write me at [email removed] or call [phone removed]',
    );
    expect(scrubFreeText('+972 54 123 4567 anytime')).toBe('[phone removed] anytime');
  });

  it('keeps training numbers', () => {
    const text = 'Did 3x10 squats at 60-80 kg in 2019, knee hurt after 12.5 km';
    expect(scrubFreeText(text)).toBe(text);
  });

  it('trims to the limit and drops empty text', () => {
    const long = 'a'.repeat(FREE_TEXT_MAX_LENGTH + 50);
    expect(scrubFreeText(long)).toHaveLength(FREE_TEXT_MAX_LENGTH + 1);
    expect(scrubFreeText(long)?.endsWith('…')).toBe(true);
    expect(scrubFreeText('   ')).toBeUndefined();
    expect(scrubFreeText(undefined)).toBeUndefined();
  });
});

describe('buildTraineeProfile', () => {
  it('sends age (not the birth date), rounded numbers and ids — never a name or email', () => {
    const result = buildTraineeProfile(
      {
        birthDate: new Date('1995-10-08T00:00:00Z'),
        height: 165.4,
        weight: 60.6,
        gender: 'female',
        goals: ['build_muscle'],
        trainingFrequency: { minDays: 3, maxDays: 4, flexibleSchedule: true },
        preferredActivities: ['pilates'],
        exercisePreferences: { favoriteExerciseNotes: 'Hip thrusts, mail maya@x.io', muscleFocus: ['glutes'] },
        equipment: ['full_gym'],
        recovery: { flags: ['nothing_to_add'], notes: '  ' },
      },
      NOW,
    );

    expect(result).toEqual({
      ageYears: 30, // her birthday is tomorrow
      heightCm: 165,
      weightKg: 61,
      gender: 'female',
      goals: ['build_muscle'],
      trainingDays: { min: 3, max: 4, flexible: true },
      preferredActivities: ['pilates'],
      muscleFocus: ['glutes'],
      equipment: ['full_gym'],
      recoveryFlags: [],
      notes: { favoriteExercises: 'Hip thrusts, mail [email removed]', exercisesToImprove: undefined, recovery: undefined },
    });
    const json = JSON.stringify(result);
    expect(json).not.toContain('1995');
    expect(json).not.toContain('@');
  });

  it('computes age on the birthday', () => {
    expect(ageInYears(new Date('1995-10-07T00:00:00Z'), NOW)).toBe(31);
  });

  it('builds the knowledge search from answer ids only (no free text to the embeddings provider)', () => {
    const query = buildKnowledgeQuery(
      profile({ recoveryFlags: ['has_injury_or_limitation'], notes: { recovery: 'my left knee hurts' } }),
    );
    expect(query).toContain('build muscle');
    expect(query).toContain('Training 3-4 days a week');
    expect(query).toContain('has injury or limitation');
    expect(query).not.toContain('knee');
  });
});

describe('candidate selection', () => {
  it('maps her equipment answer to the library, and bodyweight is always allowed', () => {
    expect([...allowedEquipment(profile({ equipment: ['dumbbells'] }))].sort()).toEqual(['bodyweight', 'dumbbell', 'no_equipment']);
    expect(allowedEquipment(profile({ equipment: ['full_gym'] })).has('machine')).toBe(true);
    expect([...allowedEquipment(profile({ equipment: ['bodyweight_only', 'bench'] }))].sort()).toEqual(['bodyweight', 'no_equipment']);
  });

  it('adds mobility / cardio only when her goals or flags call for them', () => {
    expect(candidateMovementTypes(profile())).toEqual(['strength']);
    expect(candidateMovementTypes(profile({ goals: ['lose_weight'], recoveryFlags: ['prefers_low_impact'] }))).toEqual([
      'strength',
      'mobility',
      'cardio',
    ]);
  });

  it('keeps only exercises whose equipment she has', () => {
    const library = [
      exercise('Barbell Squat'),
      exercise('Goblet Squat', { equipment: ['dumbbell'] }),
      exercise('Air Squat', { equipment: ['bodyweight'] }),
      exercise('Banded dumbbell squat', { equipment: ['dumbbell', 'resistance_band'] }),
    ];
    const names = selectCandidates(library, profile({ equipment: ['dumbbells'] }), new Set()).map((c) => c.facts.name);
    expect(names.sort()).toEqual(['Air Squat', 'Goblet Squat']);
  });

  it("gives focus muscles a larger share, offers the coach's picks first, plain names before branded ones", () => {
    const quads = Array.from({ length: 20 }, (_, i) => exercise(`Squat variation ${String(i).padStart(2, '0')}`));
    const branded = exercise('FYR2 Banded Squat Pulse');
    const coachPick = exercise('Zercher squat with a very long name that ranks last otherwise');
    const chest = Array.from({ length: 20 }, (_, i) => exercise(`Press ${i}`, { primaryMuscles: ['chest'] }));
    const neck = exercise('Neck flexion', { primaryMuscles: ['neck'] });
    const library = [...quads, branded, coachPick, ...chest, neck];

    const picked = selectCandidates(library, profile({ muscleFocus: ['legs'] }), new Set([coachPick.id]));
    const quadPicks = picked.filter((c) => c.facts.primaryMuscles[0] === 'quadriceps');
    expect(quadPicks).toHaveLength(12);
    expect(quadPicks[0].facts.name).toBe(coachPick.name);
    expect(quadPicks.map((c) => c.facts.name)).not.toContain(branded.name);
    expect(picked.filter((c) => c.facts.primaryMuscles[0] === 'chest')).toHaveLength(6);
    expect(picked.map((c) => c.facts.name)).not.toContain('Neck flexion');
    expect(picked.map((c) => c.alias)).toEqual(picked.map((_, i) => aliasFor(i)));
  });

  it('never offers more aliases than the schema allows', () => {
    const muscles = ['abdominals', 'quadriceps', 'shoulders', 'chest', 'biceps', 'triceps', 'lats', 'middle_back', 'hamstrings', 'lower_back', 'glutes'];
    const library = muscles.flatMap((muscle) => Array.from({ length: 30 }, (_, i) => exercise(`${muscle} ${i}`, { primaryMuscles: [muscle] })));
    const picked = selectCandidates(library, profile({ muscleFocus: ['legs', 'back', 'arms', 'chest', 'shoulders', 'core', 'glutes'] }), new Set());
    expect(picked.length).toBeLessThanOrEqual(MAX_CANDIDATES);
  });
});

describe('prompt', () => {
  it('lists candidates by alias with facts only, and a fixed alias enum', () => {
    const candidates = [{ alias: 'E001', facts: exercise('Back Squat') }];
    const message = buildTrainingPlanUserMessage(profile(), [], candidates);
    expect(message).toContain('E001 | Back Squat | quadriceps | barbell | beginner | strength');
    expect(message).toContain('(none available)');

    const schema = JSON.stringify(buildTrainingPlanSchema());
    expect(schema).toContain('"E001"');
    expect(schema).toContain('"E200"');
    expect(schema).not.toContain('"E201"');
    expect(schema).not.toContain('targetWeight');
    expect(schema).not.toContain('notes');
    // Gemini answers 400 to minItems / maxItems on the nested arrays.
    expect(schema).not.toContain('minItems');
    expect(schema).not.toContain('maxItems');
  });
});
