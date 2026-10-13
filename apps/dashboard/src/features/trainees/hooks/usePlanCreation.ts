import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlanWeekOptions } from '@sistem/types';
import { getActiveLanguage } from '@sistem/shared';
import { planPath } from '../../../app/config/routes';
import { createPlan, listPlanWeeks } from '../../../services/coach/coachService';
import type { SplitOnlyRequest } from '../../planBuilder/types';
import type { WeekPickerMode } from '../components/WeekPicker/WeekPicker';
import { traineesCopy } from '../copy';

/** What a new plan starts from (router state for the plan builder). */
export type PlanStart = { loadAiDraftId: string } | { splitOnly: SplitOnlyRequest };

interface OpenPicker {
  mode: WeekPickerMode;
  options: PlanWeekOptions;
  start?: PlanStart;
}

/**
 * "New plan" and "duplicate last week": the week picker (its weeks come fresh from the server
 * each time it opens), creating the plan, and going to the builder — with what the plan starts
 * from (the whole AI draft, or only its split).
 */
export function usePlanCreation(traineeId: string, onCreated: () => void) {
  const navigate = useNavigate();
  const [picker, setPicker] = useState<OpenPicker | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();

  const openPicker = useCallback(
    async (mode: WeekPickerMode, start?: PlanStart) => {
      setIsOpening(true);
      setError(undefined);
      try {
        setPicker({ mode, options: await listPlanWeeks(traineeId), start });
      } catch {
        setError(traineesCopy[getActiveLanguage()].weeksLoadError);
      } finally {
        setIsOpening(false);
      }
    },
    [traineeId],
  );

  async function create(weekStartDate: string) {
    if (!picker) return;
    setIsCreating(true);
    setError(undefined);
    try {
      const plan = await createPlan(traineeId, { weekStartDate, duplicatePrevious: picker.mode === 'duplicate' });
      onCreated();
      navigate(planPath(traineeId, plan.id), picker.start ? { state: picker.start } : undefined);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : traineesCopy[getActiveLanguage()].createError);
      onCreated();
      setIsCreating(false);
      // The weeks may have changed (e.g. a plan made elsewhere): show the fresh state.
      void openPicker(picker.mode, picker.start);
    }
  }

  return {
    picker,
    /** The picker is loading, open, or a plan is being created: other "start" actions wait. */
    isBusy: isOpening || picker !== null,
    isCreating,
    error,
    openPicker,
    closePicker: () => setPicker(null),
    create,
  };
}
