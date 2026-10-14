import { useEffect, useState } from 'react';
import type { CalculationOverrides, CalorieSuggestion } from '@sistem/types';
import { extractErrorMessage } from '@sistem/api-client';
import { getActiveLanguage } from '@sistem/shared';
import { getCalorieSuggestion } from '../../../services/coach/coachService';
import { nutritionCopy } from '../copy';
import type { NutritionDraft } from '../nutritionDraft';

// Waits for typing to settle before asking the server again.
const REFRESH_DELAY_MS = 300;

/**
 * The calculation (PRD §5.6, 13a+): BMR, TDEE, the deficit / surplus, pace, the recommended kcal
 * and portions — all the server's (deterministic code, never the AI), asked again whenever her
 * goal, formula or the coach's own values change. The last good answer stays on screen meanwhile.
 */
export function useNutritionCalc(traineeId: string, target: NutritionDraft['target']): { suggestion: CalorieSuggestion | null; requestError: string | null } {
  const [suggestion, setSuggestion] = useState<CalorieSuggestion | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { goal, formulaSex, overrides } = target;
  // A new overrides object comes with every draft change; its content is what matters.
  const overridesKey = JSON.stringify(overrides);

  useEffect(() => {
    let current = true;
    const values = JSON.parse(overridesKey) as CalculationOverrides;
    const params = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null)) as Partial<Record<keyof CalculationOverrides, number>>;
    const timer = window.setTimeout(() => {
      getCalorieSuggestion(traineeId, { goal, ...(formulaSex ? { formula: formulaSex } : {}), ...params })
        .then((next) => {
          if (!current) return;
          setSuggestion(next);
          setRequestError(null);
        })
        .catch((failure: unknown) => current && setRequestError(extractErrorMessage(failure, nutritionCopy[getActiveLanguage()].summaryError)));
    }, REFRESH_DELAY_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [traineeId, goal, formulaSex, overridesKey]);

  return { suggestion, requestError };
}
