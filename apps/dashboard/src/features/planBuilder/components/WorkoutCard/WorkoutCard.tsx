import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PlanIssue } from '@sistem/types';
import { Button } from '../../../../components/common/Button/Button';
import { DAY_LABELS } from '../../data/planDefaults';
import { useSortSensors } from '../../hooks/useSortSensors';
import { moveItem, setIntervalFlag, supersetWarnings } from '../../planDraft';
import type { DraftExercise, DraftWorkout } from '../../types';
import { DragHandle } from '../DragHandle/DragHandle';
import { ExerciseRow } from '../ExerciseRow/ExerciseRow';
import './WorkoutCard.css';

interface WorkoutCardProps {
  workout: DraftWorkout;
  index: number;
  count: number;
  /** The workout that "Add" in the exercise library adds to. */
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
  workout,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sensors = useSortSensors();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: workout.key,
  });
  const title = workout.title.trim() || `Workout ${index + 1}`;
  const { exercises } = workout;
  const warnings = supersetWarnings(exercises);
  const workoutIssues = issues.filter((issue) => issue.exerciseIndex === undefined);

  function setExercises(next: DraftExercise[]) {
    onChange({ ...workout, exercises: next });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = exercises.findIndex((exercise) => exercise.key === active.id);
    const to = exercises.findIndex((exercise) => exercise.key === over.id);
    if (from !== -1 && to !== -1) setExercises(moveItem(exercises, from, to));
  }

  function handleRemove() {
    if (exercises.length === 0 || window.confirm(`Remove "${title}" and its ${exercises.length} exercises?`)) onRemove();
  }

  const classNames = ['workout-card', isSelected && 'workout-card-selected', isDragging && 'workout-card-dragging']
    .filter(Boolean)
    .join(' ');

  return (
    // Inline style: the drag position changes every frame and can only come from dnd-kit.
    <li className={classNames} ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <div className="workout-header">
        <DragHandle label={`Drag ${title}`} attributes={attributes} listeners={listeners} setRef={setActivatorNodeRef} />
        <Button size="sm" aria-label={`Move ${title} up`} disabled={index === 0} onClick={() => onMove(-1)}>
          ↑
        </Button>
        <Button size="sm" aria-label={`Move ${title} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
          ↓
        </Button>
        <span className="workout-number">{index + 1}.</span>
        <input
          className="workout-title"
          type="text"
          aria-label="Workout title"
          value={workout.title}
          onChange={(event) => onChange({ ...workout, title: event.target.value })}
        />
        <label className="workout-day">
          <span className="visually-hidden">Day</span>
          <select
            className="workout-day-select"
            value={workout.dayOfWeek ?? ''}
            onChange={(event) =>
              onChange({ ...workout, dayOfWeek: event.target.value === '' ? undefined : Number(event.target.value) })
            }
          >
            <option value="">No day</option>
            {DAY_LABELS.map((label, day) => (
              <option key={label} value={day}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="workout-actions">
          <Button size="sm" aria-expanded={!isCollapsed} onClick={() => setIsCollapsed((collapsed) => !collapsed)}>
            {isCollapsed ? `Show (${exercises.length})` : 'Hide'}
          </Button>
          <Button size="sm" onClick={onDuplicate}>
            Duplicate
          </Button>
          <Button size="sm" variant="danger" onClick={handleRemove}>
            Remove
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
            <span className="workout-notes-label">Workout notes</span>
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
                {exercises.map((exercise, exerciseIndex) => {
                  const group = exercise.supersetGroup;
                  return (
                    <ExerciseRow
                      key={exercise.key}
                      exercise={exercise}
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
                })}
              </ul>
            </SortableContext>
          </DndContext>

          {isSelected ? (
            <p className="workout-add-hint">Exercises you add from the library go into this workout.</p>
          ) : (
            <Button size="sm" onClick={onSelect}>
              Add exercises to this workout
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
