import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlanWeekOption, PlanWeekOptions } from '@sistem/types';
import { getActiveLanguage } from '@sistem/shared';
import { planPath } from '../../../app/config/routes';
import { createPlan, listPlanWeeks } from '../../../services/coach/coachService';
import type { SplitOnlyRequest } from '../../planBuilder/types';
import { NEW_PLAN_WEEK_COUNT } from '../data/planWeeks';
import { traineesCopy } from '../copy';

/** How a new plan starts: empty, a copy of the week before, or from the AI draft. */
export type PlanStartMethod = 'scratch' | 'duplicate' | 'ai';

/** What the builder is told to load into the new plan (its router state). */
export type PlanStart = { loadAiDraftId: string } | { splitOnly: SplitOnlyRequest };

interface OpenOptions {
  /** The start method the trigger stands for (the toolbar's three pills). */
  method?: PlanStartMethod;
  /** From the AI sheet: exactly this start ("use the full plan" / "split only") instead of the latest draft. */
  aiStart?: PlanStart;
  /** The week to preselect (the Plans tab's empty week), when the popover offers it. */
  week?: string;
}

/**
 * The "new plan" popover: for which week, and how to start. The weeks (this one and the next
 * three) come fresh from the server each time it opens; the first free one is preselected.
 * Creating goes through the existing API, then to the builder; a week that already has a plan
 * opens that plan instead.
 */
export function useNewPlanPopover(traineeId: string, latestAiDraftId: string | undefined, onCreated: () => void) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PlanWeekOptions | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>();
  const [method, setMethod] = useState<PlanStartMethod>('scratch');
  const [aiStart, setAiStart] = useState<PlanStart>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();
  // Only the newest "open" may fill the popover.
  const latestOpen = useRef(0);

  const weeks: PlanWeekOption[] = options?.weeks.slice(0, NEW_PLAN_WEEK_COUNT) ?? [];
  const week = weeks.find((entry) => entry.weekStartDate === selectedWeek);
  const canUseAi = aiStart !== undefined || latestAiDraftId !== undefined;
  const canDuplicate = Boolean(week?.copiesFromWeek);
  // A method the selected week cannot use falls back to an empty plan.
  const effectiveMethod: PlanStartMethod = (method === 'duplicate' && !canDuplicate) || (method === 'ai' && !canUseAi) ? 'scratch' : method;

  const open = useCallback(
    async ({ method: wanted = 'scratch', aiStart: wantedAiStart, week: wantedWeek }: OpenOptions = {}) => {
      const request = ++latestOpen.current;
      setIsOpen(true);
      setMethod(wanted);
      setAiStart(wantedAiStart);
      setError(undefined);
      setOptions(null);
      try {
        const loaded = await listPlanWeeks(traineeId);
        if (request !== latestOpen.current) return;
        const offered = loaded.weeks.slice(0, NEW_PLAN_WEEK_COUNT);
        setOptions(loaded);
        // The first free week; when all four are taken, the first (it opens its plan).
        const asked = wantedWeek ? offered.find((entry) => entry.weekStartDate === wantedWeek) : undefined;
        setSelectedWeek((asked ?? offered.find((entry) => entry.plan === null) ?? offered[0])?.weekStartDate);
      } catch {
        if (request === latestOpen.current) setError(traineesCopy[getActiveLanguage()].weeksLoadError);
      }
    },
    [traineeId],
  );

  const close = useCallback(() => {
    latestOpen.current += 1;
    setIsOpen(false);
  }, []);

  /** The primary button: open the week's existing plan, or create one and go to the builder. */
  async function confirm() {
    if (!week) return;
    if (week.plan) {
      navigate(planPath(traineeId, week.plan.id));
      return;
    }
    setIsCreating(true);
    setError(undefined);
    try {
      const plan = await createPlan(traineeId, { weekStartDate: week.weekStartDate, duplicatePrevious: effectiveMethod === 'duplicate' });
      onCreated();
      const start = effectiveMethod === 'ai' ? (aiStart ?? (latestAiDraftId ? { loadAiDraftId: latestAiDraftId } : undefined)) : undefined;
      navigate(planPath(traineeId, plan.id), start ? { state: start } : undefined);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : traineesCopy[getActiveLanguage()].createError);
      setIsCreating(false);
      onCreated();
      // The weeks may have changed (e.g. a plan made elsewhere): show the fresh state.
      void open({ method, aiStart });
    }
  }

  return {
    isOpen,
    /** The weeks are still on their way. */
    isLoading: isOpen && options === null && error === undefined,
    currentWeekStart: options?.currentWeekStart,
    weeks,
    week,
    method: effectiveMethod,
    canDuplicate,
    canUseAi,
    isCreating,
    error,
    open,
    close,
    selectWeek: setSelectedWeek,
    selectMethod: setMethod,
    confirm,
  };
}

export type NewPlanPopoverState = ReturnType<typeof useNewPlanPopover>;
