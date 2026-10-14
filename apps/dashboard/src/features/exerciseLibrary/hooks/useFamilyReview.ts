import { useCallback, useState } from 'react';
import type { ExerciseFamilyDetail, PatternId } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { getActiveLanguage } from '@sistem/shared';
import { mergeExerciseFamily, setExerciseFamilyPrimary, splitExerciseFamily, updateExerciseFamily } from '../../../services/coach/coachService';
import { exerciseLibraryCopy } from '../copy';

interface ReviewOptions {
  family: ExerciseFamilyDetail | undefined;
  setFamily: (family: ExerciseFamilyDetail) => void;
  /** The server accepted a change: `next` = select that family instead (after a split). */
  onChanged: (family: ExerciseFamilyDetail, next?: string) => void;
}

/**
 * Every change the coach can make to a family, through the existing endpoints. The quick ones
 * (mark reviewed, set the pattern, set the main exercise) show at once and are undone with an
 * error line if the server refuses; rename / split / merge wait for the server's answer.
 */
export function useFamilyReview({ family, setFamily, onChanged }: ReviewOptions) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string>();
  // The pink "marked reviewed" strip, until another family is opened.
  const [justReviewed, setJustReviewed] = useState(false);

  const run = useCallback(
    async (action: () => Promise<ExerciseFamilyDetail>, optimistic?: ExerciseFamilyDetail, next?: (result: ExerciseFamilyDetail) => string | undefined) => {
      if (!family) return false;
      const before = family;
      setIsBusy(true);
      setError(undefined);
      if (optimistic) setFamily(optimistic);
      try {
        const result = await action();
        const nextId = next?.(result);
        if (!nextId) setFamily(result);
        onChanged(result, nextId);
        return true;
      } catch (failure) {
        if (optimistic) setFamily(before);
        // The server's message is already in her language.
        setError(extractErrorMessage(failure, exerciseLibraryCopy[getActiveLanguage()].actionError));
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [family, setFamily, onChanged],
  );

  const now = () => new Date().toISOString();

  return {
    isBusy,
    error,
    justReviewed,
    markReviewed: async () => {
      if (!family) return;
      setJustReviewed(true);
      if (!(await run(() => updateExerciseFamily(family.id, { reviewed: true }), { ...family, reviewedAt: now() }))) setJustReviewed(false);
    },
    /** The unclear-pattern fix: her pattern choice and "reviewed" in one save. */
    savePatternsAndReview: async (patterns: PatternId[]) => {
      if (!family) return;
      setJustReviewed(true);
      if (!(await run(() => updateExerciseFamily(family.id, { patterns, reviewed: true }), { ...family, patterns, reviewedAt: now() }))) setJustReviewed(false);
    },
    unreview: () => {
      setJustReviewed(false);
      return family && run(() => updateExerciseFamily(family.id, { reviewed: false }), { ...family, reviewedAt: null });
    },
    /** That exercise becomes the main one of its variant (the one the builder and the AI offer). */
    makeMain: (exerciseId: string) => {
      if (!family) return;
      const variant = family.members.find((member) => member.exerciseId === exerciseId)?.variant;
      const members = family.members.map((member) => (member.variant === variant ? { ...member, isPrimary: member.exerciseId === exerciseId } : member));
      return run(() => setExerciseFamilyPrimary(family.id, exerciseId), { ...family, members });
    },
    rename: (name: string) => family && run(() => updateExerciseFamily(family.id, { name })),
    savePatterns: (patterns: PatternId[]) => family && run(() => updateExerciseFamily(family.id, { patterns })),
    split: (exerciseIds: string[]) => family && run(() => splitExerciseFamily(family.id, exerciseIds), undefined, (created) => created.id),
    merge: (sourceFamilyId: string) => family && run(() => mergeExerciseFamily(family.id, sourceFamilyId)),
  };
}

export type FamilyReview = ReturnType<typeof useFamilyReview>;
