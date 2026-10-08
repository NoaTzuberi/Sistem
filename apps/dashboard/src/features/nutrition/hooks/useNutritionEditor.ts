import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CoachNutritionPlanResponse, NutritionIssue } from '@sistem/types';
import { NutritionRequestError } from '@sistem/api-client';
import { applyNutritionTemplate, publishNutritionPlan, saveNutritionPlan } from '../../../services/coach/coachService';
import { assignSavedIds, draftFromPlan, emptyDraft, keysOf, toPayload } from '../nutritionDraft';
import type { NutritionDraft } from '../nutritionDraft';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

// A nutrition plan's working copy is never seen by the trainee (only published versions
// are), so it always autosaves — shortly after the last change, and when the page is left.
const AUTOSAVE_DELAY_MS = 1500;

/**
 * The editing state of one trainee's nutrition plan: the draft, autosave, publish and
 * templates. The server decides what is valid and computes the kcal; its last answer
 * (`response`) is what the page shows for those.
 */
export function useNutritionEditor(traineeId: string, initial: CoachNutritionPlanResponse) {
  const [response, setResponse] = useState(initial);
  const [draft, setDraftState] = useState<NutritionDraft>(() =>
    initial.plan ? draftFromPlan(initial.plan) : emptyDraft(initial.defaultGoal),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveIssues, setSaveIssues] = useState<NutritionIssue[]>([]);
  const [error, setError] = useState<string>();

  const draftRef = useRef(draft);
  const savedJsonRef = useRef(JSON.stringify(toPayload(draft)));
  const [savedJson, setSavedJson] = useState(savedJsonRef.current);
  // The last payload the server refused: not retried until the draft changes.
  const [failedJson, setFailedJson] = useState<string | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const updateDraft = useCallback((update: (current: NutritionDraft) => NutritionDraft) => {
    draftRef.current = update(draftRef.current);
    setDraftState(draftRef.current);
  }, []);

  /** Starts over from what the server holds (after a template is applied). */
  const resetFrom = useCallback((next: CoachNutritionPlanResponse) => {
    const fresh = next.plan ? draftFromPlan(next.plan) : emptyDraft(next.defaultGoal);
    draftRef.current = fresh;
    setDraftState(fresh);
    savedJsonRef.current = JSON.stringify(toPayload(fresh));
    setSavedJson(savedJsonRef.current);
    setResponse(next);
  }, []);

  const fail = useCallback((failure: unknown, fallback: string) => {
    setSaveIssues(failure instanceof NutritionRequestError ? failure.issues : []);
    setError(failure instanceof Error ? failure.message : fallback);
  }, []);

  /** Saves what changed since the last save. Resolves to false when the server refused it. */
  const save = useCallback(async (): Promise<boolean> => {
    while (inFlight.current) await inFlight.current;

    const sent = draftRef.current;
    const payload = toPayload(sent);
    const sentJson = JSON.stringify(payload);
    if (sentJson === savedJsonRef.current) return true;

    const run = (async () => {
      setIsSaving(true);
      try {
        const saved = await saveNutritionPlan(traineeId, payload);
        const sentKeys = keysOf(sent);
        if (saved.plan) {
          const plan = saved.plan;
          savedJsonRef.current = JSON.stringify(toPayload(assignSavedIds(sent, sentKeys, plan)));
          updateDraft((current) => assignSavedIds(current, sentKeys, plan));
        }
        setSavedJson(savedJsonRef.current);
        setResponse(saved);
        setFailedJson(null);
        setSaveIssues([]);
        setError(undefined);
        return true;
      } catch (failure) {
        setFailedJson(sentJson);
        fail(failure, "Couldn't save the nutrition plan.");
        return false;
      } finally {
        inFlight.current = null;
        setIsSaving(false);
      }
    })();
    inFlight.current = run;
    return run;
  }, [traineeId, updateDraft, fail]);

  const payloadJson = useMemo(() => JSON.stringify(toPayload(draft)), [draft]);
  const isDirty = payloadJson !== savedJson;

  useEffect(() => {
    if (!isDirty || isSaving || payloadJson === failedJson) return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isDirty, isSaving, payloadJson, failedJson, save]);

  // Leaving the builder inside the dashboard: send the last changes.
  useEffect(() => () => void save(), [save]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const publish = useCallback(async (): Promise<boolean> => {
    if (!(await save())) return false;
    try {
      setResponse(await publishNutritionPlan(traineeId));
      setSaveIssues([]);
      setError(undefined);
      return true;
    } catch (failure) {
      fail(failure, "Couldn't publish the nutrition plan.");
      return false;
    }
  }, [traineeId, save, fail]);

  const applyTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      // Her unsaved edits first, so the server applies the template on top of them.
      if (!(await save())) return false;
      try {
        resetFrom(await applyNutritionTemplate(traineeId, templateId));
        setError(undefined);
        return true;
      } catch (failure) {
        fail(failure, "Couldn't start from that template.");
        return false;
      }
    },
    [traineeId, save, resetFrom, fail],
  );

  let saveStatus: SaveStatus = 'saved';
  if (isSaving) saveStatus = 'saving';
  else if (isDirty) saveStatus = payloadJson === failedJson ? 'error' : 'unsaved';

  return { response, draft, updateDraft, saveStatus, isDirty, saveIssues, error, save, publish, applyTemplate };
}
