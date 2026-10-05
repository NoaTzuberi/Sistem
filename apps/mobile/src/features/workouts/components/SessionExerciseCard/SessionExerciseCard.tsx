import type { LastPerformance } from '@sistem/types';
import { describeTargets, humanizeId, humanizeList } from '@sistem/shared';
import type { SessionExercise, SetValues, SetValuesByKey } from '../../data/sessionSets';
import { SESSION_COPY, lastTimeLabel, setTag } from '../../data/workoutCopy';
import { ExerciseMediaSlot } from '../ExerciseMediaSlot/ExerciseMediaSlot';
import { SessionSetRow } from '../SessionSetRow/SessionSetRow';
import './SessionExerciseCard.css';

export interface SetHandlers {
  onEdit: (key: string, patch: Partial<Omit<SetValues, 'completed'>>) => void;
  onToggle: (key: string) => void;
  onStartHold: (key: string) => void;
  onStopHold: () => void;
}

interface SessionExerciseCardProps extends SetHandlers {
  exercise: SessionExercise;
  /** "A1", "A2" inside a superset. */
  position?: string;
  values: SetValuesByKey;
  currentKey: string | null;
  lastPerformance?: LastPerformance;
  hold: { key: string; remainingMs: number } | null;
  /** Part of an interval block: the interval timer runs the holds, not the row's ▶. */
  interval?: boolean;
}

/**
 * One exercise of the session: library facts only (no imported text), the coach's
 * notes as the instructions, the targets, "last time", and one row per set.
 */
export function SessionExerciseCard({
  exercise,
  position,
  values,
  currentKey,
  lastPerformance,
  hold,
  interval = false,
  onEdit,
  onToggle,
  onStartHold,
  onStopHold,
}: SessionExerciseCardProps) {
  const facts = exercise.plan.exercise;
  const factsLine = facts
    ? [humanizeList(facts.primaryMuscles), humanizeList(facts.equipment), humanizeId(facts.difficulty)]
        // humanizeList shows '—' for an empty list; here an empty fact is just left out.
        .filter((part) => part && part !== '—')
        .join(' · ')
    : '';
  const showWeight = (key: string, targetWeight: number | undefined, timed: boolean) =>
    !timed || targetWeight !== undefined || values[key]?.weight !== undefined;
  const anyWeight = exercise.sets.some((set) => showWeight(set.key, set.target?.targetWeight, set.timed));
  const allTimed = exercise.sets.every((set) => set.timed);

  let workingNumber = 0;

  return (
    <article className="session-exercise">
      <header className="session-exercise-header">
        <h3 className="session-exercise-name">
          {position && <span className="session-exercise-position">{position}</span>}
          {facts?.name ?? 'Exercise'}
        </h3>
        {factsLine && <span className="session-exercise-facts">{factsLine}</span>}
      </header>

      <ExerciseMediaSlot exercise={facts} />

      {/* The coach's notes are the instructions the trainee sees (PRD §5.2). */}
      {exercise.plan.notes && <p className="session-exercise-notes">{exercise.plan.notes}</p>}

      <div className="session-exercise-targets">
        {describeTargets(exercise.plan.resolvedSets).map((line) => (
          <span key={line}>{line}</span>
        ))}
        {lastPerformance && (
          <span className="session-exercise-last">
            {SESSION_COPY.lastTime} {lastTimeLabel(lastPerformance)}
          </span>
        )}
      </div>

      <div className="session-exercise-columns" aria-hidden="true">
        <span>{SESSION_COPY.columnSet}</span>
        <span>{anyWeight ? SESSION_COPY.columnKg : ''}</span>
        <span>{allTimed ? SESSION_COPY.columnSec : SESSION_COPY.columnReps}</span>
        <span>{SESSION_COPY.columnDone}</span>
      </div>

      <div className="session-exercise-sets">
        {exercise.sets.map((set) => {
          if (set.type === 'working') workingNumber += 1;
          const setValues = values[set.key];
          if (!setValues) return null;
          return (
            <SessionSetRow
              key={set.key}
              set={set}
              values={setValues}
              tag={setTag(set.type, workingNumber)}
              isCurrent={set.key === currentKey}
              weightStep={exercise.weightStep}
              showWeight={showWeight(set.key, set.target?.targetWeight, set.timed)}
              holdRemainingMs={hold?.key === set.key ? hold.remainingMs : null}
              allowHold={!interval}
              onEdit={(patch) => onEdit(set.key, patch)}
              onToggle={() => onToggle(set.key)}
              onStartHold={() => onStartHold(set.key)}
              onStopHold={onStopHold}
            />
          );
        })}
      </div>
    </article>
  );
}
