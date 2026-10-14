import { useCallback } from 'react';
import { getActiveLanguage, useLoad } from '@sistem/shared';
import { getNutritionPlan } from '../../../services/coach/coachService';
import { useLatestAiDraft } from '../../aiDraft/hooks/useLatestAiDraft';
import { nutritionCopy } from '../copy';

/** The Nutrition tab: her plan (working copy + what she sees), her preferences, and whether an AI nutrition draft is ready. */
export function useTraineeNutrition(traineeId: string) {
  const load = useCallback(() => getNutritionPlan(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, nutritionCopy[getActiveLanguage()].loadError);
  const aiDraft = useLatestAiDraft(traineeId, 'nutrition_plan');
  return { data, error, isLoading, reload, hasAiDraft: aiDraft.ready !== null };
}
