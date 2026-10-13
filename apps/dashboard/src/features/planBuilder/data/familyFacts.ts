import type { ExerciseFacts, ExerciseFamilySummary, ExerciseVariantSummary } from '@sistem/types';

// Phase 12b: the picker lists exercise families; the plan stores one variant's exercise.

/** The variant a pick adds: the first one her equipment and level allow, else the first listed. */
export function defaultVariant(family: ExerciseFamilySummary): ExerciseVariantSummary | undefined {
  return family.variants.find((variant) => variant.allowed !== false) ?? family.variants[0];
}

/** The exercise facts of one variant of a family — what the plan row shows. */
export function variantFacts(family: Pick<ExerciseFamilySummary, 'id' | 'muscles' | 'movementType' | 'patterns'>, variant: ExerciseVariantSummary): ExerciseFacts {
  return {
    id: variant.exerciseId,
    name: variant.name,
    primaryMuscles: family.muscles,
    equipment: variant.equipment,
    difficulty: variant.difficulty,
    movementType: family.movementType,
    familyId: family.id,
    variant: variant.variant,
    patterns: family.patterns,
  };
}
