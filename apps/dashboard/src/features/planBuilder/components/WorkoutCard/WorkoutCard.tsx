import {
  dayNames,
  emptyRequiredSlots,
  fill,
  findWorkoutType,
  formatPlural,
  groupBySlot,
  isolateLtr,
  slotLabel,
  useCopy,
  useLanguage,
  workoutTypeLabel,
} from '@sistem/shared';
import { Fragment, useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AiPlanExercise, ExerciseFacts, PlanIssue, TrainingConfig, TrainingSlot } from '@sistem/types';
import { Button } from '../../../../components/common/Button/Button';
import { useSortSensors } from '../../hooks/useSortSensors';
import { addExerciseToWorkout, changeWorkoutType, moveItem, newExercise, orderBySlots, setIntervalFlag, supersetWarnings } from '../../planDraft';
import type { DraftExercise, DraftWorkout } from '../../types';
import { DragHandle } from '../DragHandle/DragHandle';
import { ExerciseRow } from '../ExerciseRow/ExerciseRow';
import { SlotPicker } from '../SlotPicker/SlotPicker';
import './WorkoutCard.css';
import { planBuilderCopy } from '../../copy';

interface WorkoutCardProps {
  traineeId: string;
  workout: DraftWorkout;
  /** The coach's workout types and slots (null while loading: shown as a free workout). */
  config: TrainingConfig | null;
  /** The AI's picks for this workout's slots (Phase 12b drafts of the same split), offered in empty slots. */
  suggestions?: AiPlanExercise[];
  index: number;
  count: number;
  /** The workout that copy.add in the exercise library adds to. */
  isSelected: boolean;
  /** Problems the server reported for this workout and its exercises. */
  issues: PlanIssue[];
  onSelect: () => void;
  onChange: (workout: DraftWorkout) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function WorkoutCard({
  traineeId,
  workout,
  config,
  suggestions,
  index,
  count,
  isSelected,
  issues,
  onSelect,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: WorkoutCardProps) {
  const language = useLanguage();
  const copy = useCopy(planBuilderCopy);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sensors = useSortSensors();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: workout.key,
  });
  const title = workout.title.trim() || `Workout ${index + 1}`;
  const { exercises } = workout;
  const warnings = supersetWarnings(exercises, copy);
  const workoutIssues = issues.filter((issue) => issue.exerciseIndex === undefined);
  const type = findWorkoutType(config, workout.workoutType);
  // Which slot's picker is open ('*' = all exercises), and the row just added (its variants open).
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string>();

  // A typed workout keeps its exercises grouped by slot (a dragged exercise keeps its slot).
  function setExercises(next: DraftExercise[]) {
    onChange({ ...workout, exercises: orderBySlots(next, type) });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = exercises.findIndex((exercise) => exercise.key === active.id);
    const to = exercises.findIndex((exercise) => exercise.key === over.id);
    if (from !== -1 && to !== -1) setExercises(moveItem(exercises, from, to));
  }

  function handleTypeChange(typeId: string) {
    if (exercises.length > 0 && !window.confirm(copy.changeTypeConfirm)) return;
    onChange(changeWorkoutType(workout, findWorkoutType(config, typeId || undefined)));
  }

  function handlePick(facts: ExerciseFacts, slotId: string | undefined) {
    const next = addExerciseToWorkout(workout, facts, type, slotId);
    const added = next.exercises.find((exercise) => !exercises.some((existing) => existing.key === exercise.key));
    onChange(next);
    setJustAdded(added?.key);
    setPickerSlot(null);
  }

  function handleUseSuggestion(suggestion: AiPlanExercise) {
    if (!suggestion.exercise) return;
    const exercise = {
      ...newExercise(suggestion.exercise, suggestion.slotId),
      mode: suggestion.durationSec != null && suggestion.reps == null ? ('time' as const) : ('reps' as const),
      sets: suggestion.sets,
      reps: suggestion.reps ?? undefined,
      repsMax: suggestion.repsMax ?? undefined,
      durationSec: suggestion.durationSec ?? undefined,
      restSec: suggestion.restSec ?? undefined,
    };
    setExercises([...exercises, exercise]);
  }

  /** The AI's picks for a slot that aren't in the workout yet. */
  function slotSuggestions(slot: TrainingSlot): AiPlanExercise[] {
    return (suggestions ?? []).filter(
      (suggestion) => suggestion.slotId === slot.id && suggestion.exercise && !exercises.some((exercise) => exercise.exerciseId === suggestion.exerciseId),
    );
  }

  function renderRow(exercise: DraftExercise, exerciseIndex: number) {
    const group = exercise.supersetGroup;
    return (
      <ExerciseRow
        key={exercise.key}
        traineeId={traineeId}
        exercise={exercise}
        openVariants={exercise.key === justAdded}
        index={exerciseIndex}
        count={exercises.length}
        joinsPrevious={group !== '' && exercises[exerciseIndex - 1]?.supersetGroup === group}
        joinsNext={group !== '' && exercises[exerciseIndex + 1]?.supersetGroup === group}
        issues={issues.filter((issue) => issue.exerciseIndex === exerciseIndex).map((issue) => issue.message)}
        warning={warnings.get(exercise.key)}
        onChange={(next) => setExercises(exercises.map((other) => (other.key === next.key ? next : other)))}
        onIntervalChange={(interval) => setExercises(setIntervalFlag(exercises, exercise.key, interval))}
        onMove={(direction) => setExercises(moveItem(exercises, exerciseIndex, exerciseIndex + direction))}
        onRemove={() => setExercises(exercises.filter((other) => other.key !== exercise.key))}
      />
    );
  }

  function renderPicker(slot: TrainingSlot | undefined, key: string) {
    if (pickerSlot !== key) return null;
    return (
      <li className="workout-slot-picker">
        <SlotPicker
          traineeId={traineeId}
          workoutType={slot ? workout.workoutType : undefined}
          slot={slot}
          title={slot ? fill(copy.pickerTitle, { slot: slotLabel(slot, language) }) : copy.pickerAllTitle}
          onPick={(facts) => handlePick(facts, slot?.id)}
          onClose={() => setPickerSlot(null)}
        />
      </li>
    );
  }

  const grouped = type ? groupBySlot(exercises, type) : null;
  const emptyRequired = emptyRequiredSlots(exercises, type);

  function handleRemove() {
    if (exercises.length === 0 || window.confirm(fill(copy.removeWorkoutConfirm, { title, count: exercises.length }))) onRemove();
  }

  const classNames = ['workout-card', isSelected && 'workout-card-selected', isDragging && 'workout-card-dragging']
    .filter(Boolean)
    .join(' ');

  return (
    // Inline style: the drag position changes every frame and can only come from dnd-kit.
    <li className={classNames} ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <div className="workout-header">
        <DragHandle label={fill(copy.dragNamed, { name: title })} attributes={attributes} listeners={listeners} setRef={setActivatorNodeRef} />
        <Button size="sm" aria-label={fill(copy.moveUpNamed, { name: title })} disabled={index === 0} onClick={() => onMove(-1)}>
          ↑
        </Button>
        <Button size="sm" aria-label={fill(copy.moveDownNamed, { name: title })} disabled={index === count - 1} onClick={() => onMove(1)}>
          ↓
        </Button>
        <span className="workout-number">{index + 1}.</span>
        <input
          className="workout-title"
          type="text"
          aria-label={copy.workoutTitle}
          value={workout.title}
          onChange={(event) => onChange({ ...workout, title: event.target.value })}
        />
        <label className="workout-day">
          <span className="visually-hidden">{copy.day}</span>
          <select
            className="workout-day-select"
            value={workout.dayOfWeek ?? ''}
            onChange={(event) =>
              onChange({ ...workout, dayOfWeek: event.target.value === '' ? undefined : Number(event.target.value) })
            }
          >
            <option value="">{copy.noDay}</option>
            {dayNames(language).map((label, day) => (
              <option key={label} value={day}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="workout-type">
          <span className="visually-hidden">{copy.workoutType}</span>
          <select className="workout-day-select" value={workout.workoutType ?? ''} onChange={(event) => handleTypeChange(event.target.value)}>
            <option value="">{workoutTypeLabel(undefined, language)}</option>
            {/* A type her config no longer has stays selectable until she changes it. */}
            {workout.workoutType && !type && <option value={workout.workoutType}>{workoutTypeLabel(workout.workoutType, language)}</option>}
            {config?.workoutTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {workoutTypeLabel(option, language)}
              </option>
            ))}
          </select>
        </label>
        <div className="workout-actions">
          <Button size="sm" aria-expanded={!isCollapsed} onClick={() => setIsCollapsed((collapsed) => !collapsed)}>
            {isCollapsed ? fill(copy.show, { count: exercises.length }) : copy.hide}
          </Button>
          <Button size="sm" onClick={onDuplicate}>
            {copy.duplicate}
          </Button>
          <Button size="sm" variant="danger" onClick={handleRemove}>
            {copy.remove}
          </Button>
        </div>
      </div>

      {workoutIssues.length > 0 && (
        <ul className="workout-issues">
          {workoutIssues.map((issue) => (
            <li key={issue.message} role="alert">
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {!isCollapsed && (
        <div className="workout-body">
          <label className="workout-notes">
            <span className="workout-notes-label">{copy.workoutNotes}</span>
            <textarea
              className="workout-notes-input"
              rows={1}
              value={workout.notes}
              onChange={(event) => onChange({ ...workout, notes: event.target.value })}
            />
          </label>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={exercises.map((exercise) => exercise.key)} strategy={verticalListSortingStrategy}>
              <ul className="workout-exercises">
                {grouped ? (
                  <>
                    {grouped.sections.map(({ slot, exerciseIndexes }) => (
                      <Fragment key={slot.id}>
                        <li className="workout-slot-head">
                          <span className="workout-slot-name">{slotLabel(slot, language)}</span>
                          {slot.required && <span className="workout-slot-required">{copy.slotRequired}</span>}
                          <span className="workout-slot-count">{isolateLtr(fill(copy.slotCount, { count: exerciseIndexes.length, max: slot.maxExercises }))}</span>
                          <Button
                            size="sm"
                            aria-label={fill(copy.addToSlotNamed, { slot: slotLabel(slot, language) })}
                            onClick={() => setPickerSlot(pickerSlot === slot.id ? null : slot.id)}
                          >
                            {copy.addToSlot}
                          </Button>
                        </li>
                        {exerciseIndexes.map((exerciseIndex) => renderRow(exercises[exerciseIndex], exerciseIndex))}
                        {exerciseIndexes.length === 0 &&
                          slotSuggestions(slot).map((suggestion) => (
                            <li key={suggestion.exerciseId} className="workout-suggestion">
                              <span className="workout-suggestion-tag">✦ {copy.aiSuggestion}</span>
                              <bdi className="workout-suggestion-name">{suggestion.exercise?.name}</bdi>
                              <span className="workout-suggestion-why" dir="auto">
                                {suggestion.why}
                              </span>
                              <Button size="sm" onClick={() => handleUseSuggestion(suggestion)}>
                                {copy.useSuggestion}
                              </Button>
                            </li>
                          ))}
                        {renderPicker(slot, slot.id)}
                      </Fragment>
                    ))}
                    {grouped.other.length > 0 && (
                      <>
                        <li className="workout-slot-head">
                          <span className="workout-slot-name">{copy.otherSlot}</span>
                        </li>
                        {grouped.other.map((exerciseIndex) => renderRow(exercises[exerciseIndex], exerciseIndex))}
                      </>
                    )}
                  </>
                ) : (
                  exercises.map((exercise, exerciseIndex) => renderRow(exercise, exerciseIndex))
                )}
                {renderPicker(undefined, '*')}
              </ul>
            </SortableContext>
          </DndContext>

          {emptyRequired.length > 0 && (
            <p className="workout-slot-hint">{formatPlural(language, copy.emptyRequired, emptyRequired.length)}</p>
          )}
          {!type && pickerSlot !== '*' && (
            <Button size="sm" onClick={() => setPickerSlot('*')}>
              {copy.addToSlot}
            </Button>
          )}
          {isSelected ? (
            <p className="workout-add-hint">{copy.libraryTarget}</p>
          ) : (
            <Button size="sm" onClick={onSelect}>
              {copy.addExercisesHere}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
