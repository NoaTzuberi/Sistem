import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../../../components/common/Button/Button';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { humanizeId } from '@sistem/shared';
import { SUPERSET_LABELS } from '../../data/planDefaults';
import { isTimedExercise, toPerSetTargets, toSimpleTargets } from '../../planDraft';
import type { DraftExercise } from '../../types';
import { DragHandle } from '../DragHandle/DragHandle';
import { SetTargetsTable } from '../SetTargetsTable/SetTargetsTable';
import './ExerciseRow.css';

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
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.key,
  });
  const name = exercise.facts?.name ?? 'Exercise no longer in the library';
  const facts = exercise.facts
    ? [...exercise.facts.primaryMuscles, ...exercise.facts.equipment, exercise.facts.difficulty].map(humanizeId).join(' · ')
    : '';
  const isPerSet = exercise.setTargets !== null;

  function handleBackToSimple() {
    if (window.confirm('Back to simple targets? The per-set values will be replaced by one value for every set.')) {
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
        <DragHandle label={`Drag ${name}`} attributes={attributes} listeners={listeners} setRef={setActivatorNodeRef} />
        <Button size="sm" aria-label={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(-1)}>
          ↑
        </Button>
        <Button size="sm" aria-label={`Move ${name} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
          ↓
        </Button>
        {exercise.supersetGroup && <span className="exercise-superset-label">{exercise.supersetGroup}</span>}
        <div className="exercise-title">
          <span className="exercise-name">{name}</span>
          {facts && <span className="exercise-facts">{facts}</span>}
        </div>
        <Button size="sm" variant="danger" aria-label={`Remove ${name}`} onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="exercise-fields">
        {!isPerSet && (
          <>
            <NumberField label="Sets" min={1} value={exercise.sets} onChange={(sets) => onChange({ ...exercise, sets })} />

            <div className="exercise-mode" role="group" aria-label="Count reps or time">
              <button
                className="exercise-mode-option"
                type="button"
                aria-pressed={exercise.mode === 'reps'}
                onClick={() => onChange({ ...exercise, mode: 'reps' })}
              >
                Reps
              </button>
              <button
                className="exercise-mode-option"
                type="button"
                aria-pressed={exercise.mode === 'time'}
                onClick={() => onChange({ ...exercise, mode: 'time' })}
              >
                Time
              </button>
            </div>

            {exercise.mode === 'reps' ? (
              <>
                <NumberField label="Reps" min={1} value={exercise.reps} onChange={(reps) => onChange({ ...exercise, reps })} />
                <NumberField
                  label="to (optional)"
                  min={1}
                  value={exercise.repsMax}
                  onChange={(repsMax) => onChange({ ...exercise, repsMax })}
                />
              </>
            ) : (
              <NumberField
                label="Seconds"
                min={1}
                value={exercise.durationSec}
                onChange={(durationSec) => onChange({ ...exercise, durationSec })}
              />
            )}

            <NumberField
              label="Weight (kg)"
              step={0.5}
              value={exercise.targetWeight}
              onChange={(targetWeight) => onChange({ ...exercise, targetWeight })}
            />
            <NumberField label="Rest (sec)" value={exercise.restSec} onChange={(restSec) => onChange({ ...exercise, restSec })} />
          </>
        )}

        <label className="exercise-superset">
          <span className="exercise-field-label">Superset</span>
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
            <span>Interval</span>
            <span className="exercise-interval-hint">
              {exercise.supersetGroup ? `whole superset ${exercise.supersetGroup} · ` : ''}seconds = work, rest = rest, sets = rounds
            </span>
          </label>
        )}

        {isPerSet ? (
          <Button size="sm" className="exercise-toggle" onClick={handleBackToSimple}>
            Back to simple
          </Button>
        ) : (
          <Button size="sm" className="exercise-toggle" onClick={() => onChange({ ...exercise, setTargets: toPerSetTargets(exercise) })}>
            Per-set targets
          </Button>
        )}
      </div>

      {exercise.setTargets && (
        <SetTargetsTable targets={exercise.setTargets} onChange={(setTargets) => onChange({ ...exercise, setTargets })} />
      )}

      <label className="exercise-notes">
        <span className="exercise-field-label">Notes — the trainee sees these as the instructions</span>
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
