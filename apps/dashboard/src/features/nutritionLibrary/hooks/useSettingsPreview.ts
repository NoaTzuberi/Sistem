import { useEffect, useState } from 'react';
import type { CalorieSuggestion, NutritionSettingsPayload } from '@sistem/types';
import { previewNutritionSettings } from '../../../services/coach/coachService';

// Waits for typing / stepping to settle before asking the server again.
const REFRESH_DELAY_MS = 250;

/**
 * The live preview: the unsaved numbers run through THE calculation on the server (the same code
 * the builder's suggestion uses), on its fixed example trainee. While a field is invalid there is
 * no payload; the last good answer stays on screen meanwhile.
 */
export function useSettingsPreview(payload: NutritionSettingsPayload | undefined) {
  const [suggestion, setSuggestion] = useState<CalorieSuggestion | null>(null);
  const [hasError, setHasError] = useState(false);
  const key = payload ? JSON.stringify(payload) : null;

  useEffect(() => {
    if (key === null) return;
    let current = true;
    const timer = window.setTimeout(() => {
      previewNutritionSettings(JSON.parse(key) as NutritionSettingsPayload)
        .then((next) => {
          if (!current) return;
          setSuggestion(next);
          setHasError(false);
        })
        .catch(() => current && setHasError(true));
    }, REFRESH_DELAY_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [key]);

  return { suggestion, hasError, isInvalid: key === null };
}
