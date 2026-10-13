import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { AiTrainingPlanDraft, ExerciseFacts } from '@sistem/types';
import { applyAiDraft } from '../apps/dashboard/src/features/aiDraft/aiDraftToPlan';
import { addExerciseToWorkout, newWorkout, removeExercise, toPayload } from '../apps/dashboard/src/features/planBuilder/planDraft';
import type { PlanDraft } from '../apps/dashboard/src/features/planBuilder/types';

// The plan builder's buttons stopped answering (design round 1). Two guards:
//  1. the state changes behind "Remove exercise" and "Use the full AI plan";
//  2. the CSS mistake that caused it — an absolutely positioned ::before / ::after whose own
//     element is not positioned stretches over a far ancestor and swallows every click there.

const facts = (id: string, name: string): ExerciseFacts => ({
  id,
  name,
  primaryMuscles: ['quadriceps'],
  equipment: ['dumbbell'],
  difficulty: 'beginner',
  movementType: 'compound',
});

describe('plan builder state', () => {
  it('removes one exercise and keeps the others in order', () => {
    let workout = newWorkout('Lower');
    for (const [id, name] of [['e1', 'Squat'], ['e2', 'Lunge'], ['e3', 'Bridge']]) {
      workout = addExerciseToWorkout(workout, facts(id, name), undefined);
    }
    const next = removeExercise(workout, workout.exercises[1].key);

    expect(next.exercises.map((exercise) => exercise.exerciseId)).toEqual(['e1', 'e3']);
    // The original is untouched: the editor compares drafts to know what changed.
    expect(workout.exercises).toHaveLength(3);
  });

  it('removing a key that is not there changes nothing', () => {
    const workout = addExerciseToWorkout(newWorkout('Lower'), facts('e1', 'Squat'), undefined);
    expect(removeExercise(workout, 'missing').exercises).toHaveLength(1);
  });

  it('applies an AI draft: its workouts replace the plan and the plan is linked to it', () => {
    const plan: PlanDraft = { notes: 'Deload week', workouts: [newWorkout('Old workout')] };
    const output: AiTrainingPlanDraft = {
      summary: 'Summary',
      considerations: [],
      splitId: 'full_body',
      workouts: [
        {
          title: 'Full body A',
          focus: 'Legs first',
          dayOfWeek: 0,
          workoutType: 'full_body',
          exercises: [{ exerciseId: 'e1', exercise: facts('e1', 'Squat'), sets: 3, reps: 10, repsMax: 12, restSec: 60, why: 'Base', slotId: 'legs_knee' }],
        },
        { title: 'Full body B', focus: 'Back', exercises: [] },
      ],
    } as unknown as AiTrainingPlanDraft;

    const next = applyAiDraft(plan, { id: 'rec1', output });

    expect(next.aiRecommendationId).toBe('rec1');
    expect(next.splitId).toBe('full_body');
    expect(next.notes).toBe('Deload week');
    expect(next.workouts.map((workout) => workout.title)).toEqual(['Full body A', 'Full body B']);
    const [exercise] = next.workouts[0].exercises;
    expect(exercise).toMatchObject({ exerciseId: 'e1', sets: 3, reps: 10, repsMax: 12, restSec: 60, slotId: 'legs_knee', notes: '' });
    // Nothing of the AI draft carries a server id: the save stores it all as new items.
    expect(toPayload(next).workouts[0].id).toBeUndefined();
    expect(toPayload(next).aiRecommendationId).toBe('rec1');
  });

  it('a draft without output leaves the plan as it is', () => {
    const plan: PlanDraft = { notes: '', workouts: [newWorkout('Mine')] };
    expect(applyAiDraft(plan, { id: 'rec1', output: null })).toBe(plan);
  });
});

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return name.endsWith('.css') ? [path] : [];
  });
}

const POSITIONED = /position:\s*(relative|absolute|fixed|sticky)/;

describe('dashboard CSS', () => {
  it('anchors every absolutely positioned pseudo-element to its own element', () => {
    const unanchored: string[] = [];
    for (const file of cssFiles('apps/dashboard/src')) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));
      for (const rule of rules) {
        if (!/::(before|after)/.test(rule.selector) || !/position:\s*absolute/.test(rule.body)) continue;
        for (const selector of rule.selector.split(',')) {
          const host = selector.trim().replace(/::(before|after)$/, '');
          // The host must be positioned: by the same selector, or by the class it is a variant of
          // ('.pill-button-sm' is a '.pill-button'; '.x:hover' and '.x[aria-…]' are '.x').
          const base = host.split(/\s+/).at(-1)!;
          const anchored = rules.some(
            (other) =>
              POSITIONED.test(other.body) &&
              other.selector.split(',').some((candidate) => {
                const name = candidate.trim();
                return name === host || name === base || (base.startsWith(name) && /^[-.:[]/.test(base.slice(name.length)));
              }),
          );
          if (!anchored) unanchored.push(`${file}: ${selector.trim()}`);
        }
      }
    }
    expect(unanchored).toEqual([]);
  });
});
