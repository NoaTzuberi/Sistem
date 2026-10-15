import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NutritionSettingsResponse } from '@sistem/types';
import { getActiveLanguage, useCopy, useLoad } from '@sistem/shared';
import { getNutritionSettings, saveNutritionSettings } from '../../../services/coach/coachService';
import { errorText } from '../data/errorText';
import { sameSettings, toForm, toPayload, validateSettings } from '../data/settingsForm';
import type { SettingsForm } from '../data/settingsForm';
import type { FoodActionResult } from './useFoods';
import { nutritionLibraryCopy } from '../copy';

/**
 * THE coach-tunable nutrition config (PRD §5.6): the form, what changed since the last save, every
 * field's range check, save and cancel. Saved numbers apply to suggestions from now on; published
 * versions keep theirs (the server's rule).
 */
export function useNutritionSettings() {
  const copy = useCopy(nutritionLibraryCopy);
  const { data, error, isLoading, reload } = useLoad(getNutritionSettings, copy.settingsLoadError);
  const [response, setResponse] = useState<NutritionSettingsResponse>();
  const [form, setForm] = useState<SettingsForm>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setResponse(data);
    setForm(toForm(data.config));
  }, [data]);

  const saved = useMemo(() => (response ? toForm(response.config) : undefined), [response]);
  const errors = useMemo(() => (form ? validateSettings(form) : {}), [form]);
  const payload = useMemo(() => (form ? toPayload(form, errors) : undefined), [form, errors]);
  const isDirty = form !== undefined && saved !== undefined && !sameSettings(form, saved);

  const update = useCallback((change: (current: SettingsForm) => SettingsForm) => {
    setForm((current) => (current ? change(current) : current));
  }, []);

  const cancel = useCallback(() => {
    if (saved) setForm(saved);
  }, [saved]);

  const resetDefaults = useCallback(() => {
    if (response) setForm(toForm(response.defaults));
  }, [response]);

  const save = useCallback(async (): Promise<FoodActionResult> => {
    const text = nutritionLibraryCopy[getActiveLanguage()];
    if (!payload) return { ok: false, message: text.settingsSaveError };
    setIsSaving(true);
    try {
      const next = await saveNutritionSettings(payload);
      setResponse(next);
      setForm(toForm(next.config));
      return { ok: true, message: text.settingsSaved };
    } catch (failure) {
      return { ok: false, message: errorText(failure, text.settingsSaveError) };
    } finally {
      setIsSaving(false);
    }
  }, [payload]);

  return {
    form,
    errors,
    payload,
    isDirty,
    isSaving,
    error: response ? undefined : error,
    isLoading,
    reload,
    update,
    cancel,
    resetDefaults,
    save,
  };
}
