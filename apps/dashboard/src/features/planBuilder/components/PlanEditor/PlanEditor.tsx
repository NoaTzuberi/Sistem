import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { AiPlanExercise, AiTrainingRecommendation, CoachPlan, ExerciseFacts } from '@sistem/types';
import { traineePath } from '../../../../app/config/routes';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import {
  fill,
  findWorkoutType,
  formatWeekSpanWithDays,
  sharedCopy,
  useCopy,
  useLanguage,
  weekRelationLabel,
  workoutTypeLabel,
} from '@sistem/shared';
import { usePlanEditor } from '../../hooks/usePlanEditor';
import { useSortSensors } from '../../hooks/useSortSensors';
import { addExerciseToWorkout, duplicateWorkout, moveItem, newWorkout } from '../../planDraft';
import type { DraftWorkout } from '../../types';
import { ExerciseLibrary } from '../ExerciseLibrary/ExerciseLibrary';
import { SaveIndicator } from '../SaveIndicator/SaveIndicator';
import { WorkoutCard } from '../WorkoutCard/WorkoutCard';
import { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import { draftWorkoutsFromAi, draftWorkoutsFromSplit } from '../../../aiDraft/aiDraftToPlan';
import { useTrainingConfig } from '../../../trainingConfig/useTrainingConfig';
import type { SplitOnlyRequest } from '../../types';
import { AiRationalePanel } from '../../../aiDraft/components/AiRationalePanel/AiRationalePanel';
import { aiDraftCopy } from '../../../aiDraft/copy';
import './PlanEditor.css';
import { planBuilderCopy } from '../../copy';

interface PlanEditorProps {
  traineeId: string;
  traineeName: string;
  /** The trainee's current week, from the server — labels this plan 'This week' / 'Next week'. */
  currentWeekStart: string;
  initialPlan: CoachPlan;
  /** Fill this (empty, draft) plan from that AI draft once it is loaded ("Use full AI plan"). */
  loadAiDraftId?: string;
  /** Phase 12b "Use split only": empty typed workouts of that split, the AI's picks as slot suggestions. */
  splitOnly?: SplitOnlyRequest;
}

export function PlanEditor({ traineeId, traineeName, currentWeekStart, initialPlan, loadAiDraftId, splitOnly }: PlanEditorProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const aiText = useCopy(aiDraftCopy);
  const copy = useCopy(planBuilderCopy);
  const navigate = useNavigate();
  const location = useLocation();
  const ai = useLatestAiDraft(traineeId);
  const sensors = useSortSensors();
  const { plan, draft, updateDraft, saveStatus, isDirty, issues, error, save, publish, unpublish, remove } = usePlanEditor(
    traineeId,
    initialPlan,
  );
  const [selectedKey, setSelectedKey] = useState<string | undefined>(draft.workouts[0]?.key);
  const [isBusy, setIsBusy] = useState(false);
  const config = useTrainingConfig();
  const [newWorkoutType, setNewWorkoutType] = useState('');

  const isPublished = plan.status === 'published';
  const { workouts } = draft;
  // The library adds to the selected workout; without a valid selection, to the first.
  const selected = workouts.find((workout) => workout.key === selectedKey) ?? workouts[0];
  const planIssues = issues.filter((issue) => issue.workoutIndex === undefined);
  const plansTab = traineePath(traineeId, 'plans');

  function setWorkouts(update: (current: DraftWorkout[]) => DraftWorkout[]) {
    updateDraft((current) => ({ ...current, workouts: update(current.workouts) }));
  }

  function loadAiDraft(recommendation: AiTrainingRecommendation) {
    if (!recommendation.output) return;
    const aiWorkouts = draftWorkoutsFromAi(recommendation.output);
    // The editor's draft is replaced; autosave stores it through the normal plan rules.
    updateDraft((current) => ({
      ...current,
      aiRecommendationId: recommendation.id,
      splitId: recommendation.output?.splitId ?? current.splitId,
      workouts: aiWorkouts,
    }));
    setSelectedKey(aiWorkouts[0]?.key);
  }

  // The AI's picks for a workout of the linked draft (same position and workout type): offered in its empty slots.
  function suggestionsFor(index: number): AiPlanExercise[] | undefined {
    const output = ai.latest?.id === draft.aiRecommendationId ? ai.latest?.output : undefined;
    const aiWorkout = output?.splitId ? output.workouts[index] : undefined;
    return aiWorkout && aiWorkout.workoutType === workouts[index]?.workoutType ? aiWorkout.exercises : undefined;
  }

  function handleLoadAiDraft() {
    if (!ai.ready) return;
    if (workouts.length > 0 && !window.confirm(aiText.training.replaceConfirm)) return;
    loadAiDraft(ai.ready);
  }

  // "Use full AI plan" / "Use split only": once, into the empty draft; the router state is
  // cleared so a reload never loads it again.
  const autoLoaded = useRef(false);
  useEffect(() => {
    if (autoLoaded.current) return;
    if (loadAiDraftId && ai.ready?.id === loadAiDraftId) {
      autoLoaded.current = true;
      if (!isPublished && workouts.length === 0) loadAiDraft(ai.ready);
    } else if (splitOnly && config && (!splitOnly.recommendationId || !ai.isLoading)) {
      autoLoaded.current = true;
      if (!isPublished && workouts.length === 0) {
        const linked = splitOnly.recommendationId && ai.latest?.id === splitOnly.recommendationId ? ai.latest.output : null;
        const splitWorkouts = draftWorkoutsFromSplit(config, splitOnly.splitId, splitOnly.daysPerWeek, language, linked);
        updateDraft((current) => ({
          ...current,
          splitId: splitOnly.splitId,
          aiRecommendationId: splitOnly.recommendationId ?? current.aiRecommendationId,
          workouts: splitWorkouts,
        }));
        setSelectedKey(splitWorkouts[0]?.key);
      }
    } else return;
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the draft / config arrives
  }, [loadAiDraftId, splitOnly, ai.ready, ai.isLoading, config]);

  function handleAddWorkout() {
    const type = findWorkoutType(config, newWorkoutType || undefined);
    const title = type ? workoutTypeLabel(type, language) : fill(copy.workoutPlaceholder, { n: workouts.length + 1 });
    const workout = newWorkout(title, type?.id);
    setWorkouts((current) => [...current, workout]);
    setSelectedKey(workout.key);
  }

  function handleDuplicateWorkout(index: number) {
    const copy = duplicateWorkout(workouts[index]);
    setWorkouts((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    setSelectedKey(copy.key);
  }

  // From the side library: into the first slot that fits it (typed workout), else "Other".
  function handleAddExercise(facts: ExerciseFacts) {
    if (!selected) return;
    setWorkouts((current) =>
      current.map((workout) =>
        workout.key === selected.key ? addExerciseToWorkout(workout, facts, findWorkoutType(config, workout.workoutType)) : workout,
      ),
    );
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setWorkouts((current) => {
      const from = current.findIndex((workout) => workout.key === active.id);
      const to = current.findIndex((workout) => workout.key === over.id);
      return from !== -1 && to !== -1 ? moveItem(current, from, to) : current;
    });
  }

  async function runAction(action: () => Promise<boolean>): Promise<boolean> {
    setIsBusy(true);
    try {
      return await action();
    } finally {
      setIsBusy(false);
    }
  }

  function handlePublish() {
    if (!window.confirm(fill(copy.publishConfirm, { name: traineeName }))) return;
    void runAction(publish);
  }

  function handleUnpublish() {
    if (isDirty && !window.confirm(copy.unpublishDirtyConfirm)) return;
    if (!isDirty && !window.confirm(fill(copy.unpublishConfirm, { name: traineeName }))) return;
    void runAction(unpublish);
  }

  async function handleDelete() {
    if (!window.confirm(copy.deleteConfirm)) return;
    if (await runAction(remove)) navigate(plansTab, { replace: true });
  }

  return (
    <div className="plan-editor">
      <Link className="plan-back" to={plansTab}>
        {fill(copy.backToName, { name: traineeName })}
      </Link>

      <header className="plan-header">
        <div className="plan-heading">
          <h1 className="plan-title">
            {[weekRelationLabel(plan.weekStartDate, currentWeekStart, language), formatWeekSpanWithDays(plan.weekStartDate, language)]
              .filter(Boolean)
              .join(' · ')}
          </h1>
          <Badge tone={isPublished ? 'accent' : 'neutral'}>{shared.coach.planStatus[plan.status]}</Badge>
          {plan.locked && <Badge>{shared.coach.startedByTrainee}</Badge>}
          <SaveIndicator status={saveStatus} />
        </div>

        <div className="plan-actions">
          {isPublished ? (
            <>
              {/* Changes go live to the trainee, so a published plan is never autosaved. */}
              <Button variant="primary" disabled={!isDirty || isBusy || saveStatus === 'saving'} onClick={() => void save()}>
                {copy.saveChanges}
              </Button>
              <Button disabled={plan.locked || isBusy} onClick={handleUnpublish}>
                {copy.unpublish}
              </Button>
            </>
          ) : (
            <>
              {(ai.ready || ai.running) && (
                <Button disabled={!ai.ready || isBusy} onClick={handleLoadAiDraft}>
                  {ai.ready ? aiText.training.loadIntoPlan : aiText.training.loadingRunning}
                </Button>
              )}
              <Button disabled={!isDirty || isBusy || saveStatus === 'saving'} onClick={() => void save()}>
                {copy.saveDraft}
              </Button>
              <Button variant="primary" disabled={isBusy} onClick={handlePublish}>
                {copy.publish}
              </Button>
            </>
          )}
          <Button variant="danger" disabled={plan.locked || isBusy} onClick={handleDelete}>
            {copy.delete}
          </Button>
        </div>
      </header>

      <p className="plan-mode-note">
        {isPublished
          ? copy.liveNote
          : copy.draftNote}
        {plan.locked && copy.lockedNote}
      </p>

      {(error || planIssues.length > 0) && (
        <div className="plan-errors" role="alert">
          {issues.length > 0 ? (
            <>
              <p className="plan-errors-title">{copy.notSaved}</p>
              {planIssues.length > 0 && (
                <ul className="plan-errors-list">
                  {planIssues.map((issue) => (
                    <li key={issue.message}>{issue.message}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="plan-errors-title">{error}</p>
          )}
        </div>
      )}

      <div className="plan-layout">
        <div className="plan-main">
          {draft.aiRecommendationId && (
            <AiRationalePanel traineeId={traineeId} recommendationId={draft.aiRecommendationId} recommendation={ai.latest} />
          )}

          <label className="plan-notes">
            <span className="plan-notes-label">{copy.planNotes}</span>
            <textarea
              className="plan-notes-input"
              rows={2}
              value={draft.notes}
              onChange={(event) => {
                const notes = event.target.value;
                updateDraft((current) => ({ ...current, notes }));
              }}
            />
          </label>

          {workouts.length === 0 && <p className="plan-empty">{copy.noWorkouts}</p>}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workouts.map((workout) => workout.key)} strategy={verticalListSortingStrategy}>
              <ul className="plan-workouts">
                {workouts.map((workout, index) => (
                  <WorkoutCard
                    key={workout.key}
                    traineeId={traineeId}
                    workout={workout}
                    config={config}
                    suggestions={suggestionsFor(index)}
                    index={index}
                    count={workouts.length}
                    isSelected={workout.key === selected?.key}
                    issues={issues.filter((issue) => issue.workoutIndex === index)}
                    onSelect={() => setSelectedKey(workout.key)}
                    onChange={(next) => setWorkouts((current) => current.map((other) => (other.key === next.key ? next : other)))}
                    onMove={(direction) => setWorkouts((current) => moveItem(current, index, index + direction))}
                    onDuplicate={() => handleDuplicateWorkout(index)}
                    onRemove={() => setWorkouts((current) => current.filter((other) => other.key !== workout.key))}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className="plan-add-workout">
            <label className="plan-add-type">
              <span className="visually-hidden">{copy.newWorkoutType}</span>
              <select className="plan-add-select" value={newWorkoutType} onChange={(event) => setNewWorkoutType(event.target.value)}>
                <option value="">{workoutTypeLabel(undefined, language)}</option>
                {config?.workoutTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {workoutTypeLabel(type, language)}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={handleAddWorkout}>{copy.addWorkout}</Button>
          </div>
        </div>

        <ExerciseLibrary traineeId={traineeId} targetTitle={selected?.title} onAdd={handleAddExercise} />
      </div>
    </div>
  );
}
