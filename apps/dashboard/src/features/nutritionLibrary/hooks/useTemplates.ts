import { useCallback } from 'react';
import type { NutritionTemplate } from '@sistem/types';
import { fill, getActiveLanguage, useCopy, useLoad } from '@sistem/shared';
import { deleteNutritionTemplate, listNutritionTemplates, renameNutritionTemplate } from '../../../services/coach/coachService';
import { errorText } from '../data/errorText';
import type { FoodActionResult } from './useFoods';
import { nutritionLibraryCopy } from '../copy';

/** The coach's nutrition templates. Saving one and starting a plan from one happen in a trainee's builder. */
export function useTemplates() {
  const copy = useCopy(nutritionLibraryCopy);
  const { data, error, isLoading, reload } = useLoad(listNutritionTemplates, copy.templatesLoadError);

  const rename = useCallback(
    async (template: NutritionTemplate, name: string): Promise<FoodActionResult> => {
      const text = nutritionLibraryCopy[getActiveLanguage()];
      try {
        await renameNutritionTemplate(template.id, { name });
        reload();
        return { ok: true, message: text.renamed };
      } catch (failure) {
        return { ok: false, message: errorText(failure, text.renameError) };
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (template: NutritionTemplate): Promise<FoodActionResult> => {
      const text = nutritionLibraryCopy[getActiveLanguage()];
      try {
        await deleteNutritionTemplate(template.id);
        reload();
        return { ok: true, message: fill(text.deleted, { name: template.name }) };
      } catch (failure) {
        return { ok: false, message: errorText(failure, text.deleteError) };
      }
    },
    [reload],
  );

  return { templates: data, error: data ? undefined : error, isLoading, reload, rename, remove };
}
