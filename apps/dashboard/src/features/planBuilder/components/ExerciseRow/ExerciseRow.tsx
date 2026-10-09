import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../../../components/common/Button/Button';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { fill, humanizeId, useCopy } from '@sistem/shared';
import { SUPERSET_LABELS } from '../../data/planDefaults';
import { isTimedExercise, toPerSetTargets, toSimpleTargets } from '../../planDraft';
import type { DraftExercise } from '../../types';
import { DragHandle } from '../DragHandle/DragHandle';
import { SetTargetsTable } from '../SetTargetsTable/SetTargetsTable';
import './ExerciseRow.css';
import { planBuilderCopy } from '../../copy';

interface ExerciseRowProps {
  exercise: DraftExercise;
  index: number;
  count: number;
  /** The exercise above / below shares this one's superset label (drawn as one group). */
  joinsPrevious: boolean;
  joinsNext: boolean;
  /** Problems the server reported for this exercise on the last save / publish. */
  issues: string[];
  /** Superset hint while editing. */
  warning?: string;
  onChange: (exercise: DraftExercise) => void;
  /** Interval on / off — the workout applies it to the whole superset. */
  onIntervalChange: (interval: boolean) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

export function ExerciseRow({
  exercise,
  index,
  count,
  joinsPrevious,
  joinsNext,
  issues,
  warning,
  onChange,
  onIntervalChange,
  onMove,
  onRemove,
}: ExerciseRowProps) {
  const copy = useCopy(planBuilderCopy);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.key,
  });
  const name = exercise.facts?.name ?? copy.missingExercise;
  const facts = exercise.facts
    ? [...exercise.facts.primaryMuscles, ...exercise.facts.equipment, exercise.facts.difficulty].map(humanizeId).join(' · ')
    : '';
  const isPerSet = exercise.setTargets !== null;

  function handleBackToSimple() {
    if (window.confirm(copy.backToSimpleConfirm)) {
      onChange(toSimpleTargets(exercise));
    }
  }

  const classNames = [
    'exercise-row',
    exercise.supersetGroup && 'exercise-row-superset',
    joinsPrevious && 'exercise-row-joins-previous',
    joinsNext && 'exercise-row-joins-next',
    isDragging && 'exercise-row-dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // Inline style: the drag position changes every frame and can only come from dnd-kit.
    <li className={classNames} ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <div className="exercise-header">
        <DragHandle label={fill(copy.dragNamed, { name: name })} attributes={attributes} listeners={listeners} setRef={setActivatorNodeRef} />
        <Button size="sm" aria-label={fill(copy.moveUpNamed, { name: name })} disabled={index === 0} onClick={() => onMove(-1)}>
          ↑
        </Button>
        <Button size="sm" aria-label={fill(copy.moveDownNamed, { name: name })} disabled={index === count - 1} onClick={() => onMove(1)}>
          ↓
        </Button>
        {exercise.supersetGroup && <span className="exercise-superset-label">{exercise.supersetGroup}</span>}
        <div className="exercise-title">
          <span className="exercise-name" dir="auto">
            {name}
          </span>
          {facts && <span className="exercise-facts">{facts}</span>}
        </div>
        <Button size="sm" variant="danger" aria-label={fill(copy.removeNamed, { name: name })} onClick={onRemove}>
          {copy.remove}
        </Button>
      </div>

      <div className="exercise-fields">
        {!isPerSet && (
          <>
            <NumberField label={copy.sets} min={1} value={exercise.sets} onChange={(sets) => onChange({ ...exercise, sets })} />

            <div className="exercise-mode" role="group" aria-label={copy.countBy}>
              <button
                className="exercise-mode-option"
                type="button"
                aria-pressed={exercise.mode === 'reps'}
                onClick={() => onChange({ ...exercise, mode: 'reps' })}
              >
                {copy.reps}
              </button>
              <button
                className="exercise-mode-option"
                type="button"
                aria-pressed={exercise.mode === 'time'}
                onClick={() => onChange({ ...exercise, mode: 'time' })}
              >
                {copy.time}
              </button>
            </div>

            {exercise.mode === 'reps' ? (
              <>
                <NumberField label={copy.reps} min={1} value={exercise.reps} onChange={(reps) => onChange({ ...exercise, reps })} />
                <NumberField
                  label={copy.toOptional}
                  min={1}
                  value={exercise.repsMax}
                  onChange={(repsMax) => onChange({ ...exercise, repsMax })}
                />
              </>
            ) : (
              <NumberField
                label={copy.seconds}
                min={1}
                value={exercise.durationSec}
                onChange={(durationSec) => onChange({ ...exercise, durationSec })}
              />
            )}

            <NumberField
              label={copy.weightKg}
              step={0.5}
              value={exercise.targetWeight}
              onChange={(targetWeight) => onChange({ ...exercise, targetWeight })}
            />
            <NumberField label={copy.restSec} value={exercise.restSec} onChange={(restSec) => onChange({ ...exercise, restSec })} />
          </>
        )}

        <label className="exercise-superset">
          <span className="exercise-field-label">{copy.superset}</span>
          <select
            className="exercise-superset-select"
            value={exercise.supersetGroup}
            onChange={(event) => onChange({ ...exercise, supersetGroup: event.target.value })}
          >
            <option value="">—</option>
            {SUPERSET_LABELS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
            {/* A label from an older plan that is not in the list. */}
            {exercise.supersetGroup && !(SUPERSET_LABELS as readonly string[]).includes(exercise.supersetGroup) && (
              <option value={exercise.supersetGroup}>{exercise.supersetGroup}</option>
            )}
          </select>
        </label>

        {/* Shown for timed exercises (and to switch off a flag that no longer fits). */}
        {(isTimedExercise(exercise) || exercise.interval) && (
          <label className="exercise-interval">
            <input
              type="checkbox"
              checked={exercise.interval}
              onChange={(event) => onIntervalChange(event.target.checked)}
            />
            <span>{copy.interval}</span>
            <span className="exercise-interval-hint">
              {exercise.supersetGroup ? fill(copy.wholeSuperset, { group: exercise.supersetGroup }) : ''}
              {copy.intervalHint}
            </span>
          </label>
        )}

        {isPerSet ? (
          <Button size="sm" className="exercise-toggle" onClick={handleBackToSimple}>
            {copy.backToSimple}
          </Button>
        ) : (
          <Button size="sm" className="exercise-toggle" onClick={() => onChange({ ...exercise, setTargets: toPerSetTargets(exercise) })}>
            {copy.perSetTargets}
          </Button>
        )}
      </div>

      {exercise.setTargets && (
        <SetTargetsTable targets={exercise.setTargets} onChange={(setTargets) => onChange({ ...exercise, setTargets })} />
      )}

      <label className="exercise-notes">
        <span className="exercise-field-label">{copy.notesLabel}</span>
        <textarea
          className="exercise-notes-input"
          rows={2}
          value={exercise.notes}
          onChange={(event) => onChange({ ...exercise, notes: event.target.value })}
        />
      </label>

      {(issues.length > 0 || warning) && (
        <ul className="exercise-problems">
          {issues.map((message) => (
            <li key={message} className="exercise-issue" role="alert">
              {message}
            </li>
          ))}
          {warning && !issues.includes(warning) && <li className="exercise-warning">{warning}</li>}
        </ul>
      )}
    </li>
  );
}
