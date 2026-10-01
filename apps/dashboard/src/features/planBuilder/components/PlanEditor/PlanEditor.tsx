import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CoachPlan, ExerciseFacts } from '@sistem/types';
import { traineePath } from '../../../../app/config/routes';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import { formatDateOnly } from '@sistem/shared';
import { usePlanEditor } from '../../hooks/usePlanEditor';
import { useSortSensors } from '../../hooks/useSortSensors';
import { duplicateWorkout, moveItem, newExercise, newWorkout } from '../../planDraft';
import type { DraftWorkout } from '../../types';
import { ExerciseLibrary } from '../ExerciseLibrary/ExerciseLibrary';
import { SaveIndicator } from '../SaveIndicator/SaveIndicator';
import { WorkoutCard } from '../WorkoutCard/WorkoutCard';
import './PlanEditor.css';

interface PlanEditorProps {
  traineeId: string;
  traineeName: string;
  initialPlan: CoachPlan;
}

export function PlanEditor({ traineeId, traineeName, initialPlan }: PlanEditorProps) {
  const navigate = useNavigate();
  const sensors = useSortSensors();
  const { plan, draft, updateDraft, saveStatus, isDirty, issues, error, save, publish, unpublish, remove } = usePlanEditor(
    traineeId,
    initialPlan,
  );
  const [selectedKey, setSelectedKey] = useState<string | undefined>(draft.workouts[0]?.key);
  const [isBusy, setIsBusy] = useState(false);

  const isPublished = plan.status === 'published';
  const { workouts } = draft;
  // The library adds to the selected workout; without a valid selection, to the first.
  const selected = workouts.find((workout) => workout.key === selectedKey) ?? workouts[0];
  const planIssues = issues.filter((issue) => issue.workoutIndex === undefined);
  const plansTab = traineePath(traineeId, 'plans');

  function setWorkouts(update: (current: DraftWorkout[]) => DraftWorkout[]) {
    updateDraft((current) => ({ ...current, workouts: update(current.workouts) }));
  }

  function handleAddWorkout() {
    const workout = newWorkout(workouts.length + 1);
    setWorkouts((current) => [...current, workout]);
    setSelectedKey(workout.key);
  }

  function handleDuplicateWorkout(index: number) {
    const copy = duplicateWorkout(workouts[index]);
    setWorkouts((current) => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]);
    setSelectedKey(copy.key);
  }

  function handleAddExercise(facts: ExerciseFacts) {
    if (!selected) return;
    const exercise = newExercise(facts);
    setWorkouts((current) =>
      current.map((workout) => (workout.key === selected.key ? { ...workout, exercises: [...workout.exercises, exercise] } : workout)),
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
    if (!window.confirm(`Publish this plan? ${traineeName} will see it right away.`)) return;
    void runAction(publish);
  }

  function handleUnpublish() {
    if (isDirty && !window.confirm('Unpublish and keep your unsaved changes in the draft?')) return;
    if (!isDirty && !window.confirm(`Unpublish this plan? ${traineeName} will no longer see it.`)) return;
    void runAction(unpublish);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;
    if (await runAction(remove)) navigate(plansTab, { replace: true });
  }

  return (
    <div className="plan-editor">
      <Link className="plan-back" to={plansTab}>
        ← {traineeName}
      </Link>

      <header className="plan-header">
        <div className="plan-heading">
          <h1 className="plan-title">Week of {formatDateOnly(plan.weekStartDate)}</h1>
          <Badge tone={isPublished ? 'accent' : 'neutral'}>{isPublished ? 'Published' : 'Draft'}</Badge>
          {plan.locked && <Badge>Started by trainee</Badge>}
          <SaveIndicator status={saveStatus} />
        </div>

        <div className="plan-actions">
          {isPublished ? (
            <>
              {/* Changes go live to the trainee, so a published plan is never autosaved. */}
              <Button variant="primary" disabled={!isDirty || isBusy || saveStatus === 'saving'} onClick={() => void save()}>
                Save changes
              </Button>
              <Button disabled={plan.locked || isBusy} onClick={handleUnpublish}>
                Unpublish
              </Button>
            </>
          ) : (
            <>
              <Button disabled={!isDirty || isBusy || saveStatus === 'saving'} onClick={() => void save()}>
                Save draft
              </Button>
              <Button variant="primary" disabled={isBusy} onClick={handlePublish}>
                Publish
              </Button>
            </>
          )}
          <Button variant="danger" disabled={plan.locked || isBusy} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </header>

      <p className="plan-mode-note">
        {isPublished
          ? 'This plan is live. Changes reach the trainee only when you press Save changes.'
          : 'Drafts are saved automatically a few seconds after your last change.'}
        {plan.locked && ' The trainee already started a workout from it, so it can be edited but not unpublished or deleted.'}
      </p>

      {(error || planIssues.length > 0) && (
        <div className="plan-errors" role="alert">
          {issues.length > 0 ? (
            <>
              <p className="plan-errors-title">The plan was not saved. Fix the marked items:</p>
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
          <label className="plan-notes">
            <span className="plan-notes-label">Plan notes</span>
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

          {workouts.length === 0 && <p className="plan-empty">No workouts yet. Add the first one.</p>}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workouts.map((workout) => workout.key)} strategy={verticalListSortingStrategy}>
              <ul className="plan-workouts">
                {workouts.map((workout, index) => (
                  <WorkoutCard
                    key={workout.key}
                    workout={workout}
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

          <Button onClick={handleAddWorkout}>+ Add workout</Button>
        </div>

        <ExerciseLibrary targetTitle={selected?.title} onAdd={handleAddExercise} />
      </div>
    </div>
  );
}
