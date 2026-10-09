import type { WorkoutSession } from '@sistem/types';
import { describeInterval, fill, useCopy, useLanguage } from '@sistem/shared';
import { Button } from '../../../../components/common/Button/Button';
import { isIntervalBlock } from '../../data/sessionSets';
import type { SessionBlock as SessionBlockModel, SetValuesByKey } from '../../data/sessionSets';
import { workoutCopy } from '../../copy';
import { SessionExerciseCard } from '../SessionExerciseCard/SessionExerciseCard';
import type { SetHandlers } from '../SessionExerciseCard/SessionExerciseCard';
import './SessionBlock.css';

interface SessionBlockProps extends SetHandlers {
  block: SessionBlockModel;
  isOpen: boolean;
  /** The block holding the next set to do. */
  isCurrent: boolean;
  values: SetValuesByKey;
  currentKey: string | null;
  lastPerformance: WorkoutSession['lastPerformance'];
  hold: { key: string; remainingMs: number } | null;
  onOpen: () => void;
  onStartInterval: () => void;
}

/**
 * One exercise, or a superset done back to back. Only one block is open at a time;
 * the others are one-line rows (name, sets done) that open on tap.
 */
export function SessionBlock({
  block,
  isOpen,
  isCurrent,
  values,
  currentKey,
  lastPerformance,
  hold,
  onOpen,
  onStartInterval,
  ...handlers
}: SessionBlockProps) {
  const language = useLanguage();
  const copy = useCopy(workoutCopy);
  const interval = isIntervalBlock(block);
  const sets = block.exercises.flatMap((exercise) => exercise.sets);
  const done = sets.filter((set) => values[set.key]?.completed).length;
  const isDone = done === sets.length;
  const names = block.exercises.map((exercise) => exercise.plan.exercise?.name ?? 'Exercise').join(' + ');

  if (!isOpen) {
    return (
      <button type="button" className={isDone ? 'session-block-row session-block-row-done' : 'session-block-row'} onClick={onOpen}>
        <span className="session-block-row-mark" aria-hidden="true">
          {isDone ? '✓' : ''}
        </span>
        <span className="session-block-row-name">
          {block.supersetGroup && <span className="session-block-row-group">{block.supersetGroup} · </span>}
          <bdi>{names}</bdi>
        </span>
        <span className="session-block-row-count" dir="ltr">
          {done}/{sets.length}
        </span>
      </button>
    );
  }

  return (
    <section className={block.supersetGroup ? 'session-block session-block-superset' : 'session-block'}>
      {(block.supersetGroup || isCurrent) && (
        <div className="session-block-labels">
          {block.supersetGroup && <span className="session-block-group">{fill(copy.session.supersetLabel, { group: block.supersetGroup })}</span>}
          {isCurrent && <span className="session-block-now">{copy.session.now}</span>}
        </div>
      )}
      {interval && !isDone && (
        <div className="session-block-interval">
          {/* One line per circuit: rounds and the first exercise's work / rest. */}
          <span className="session-block-interval-text">{describeInterval(block.exercises[0].plan, language)}</span>
          <Button className="session-block-interval-start" onClick={onStartInterval}>
            ▶ {copy.interval.startInterval}
          </Button>
        </div>
      )}
      {block.exercises.map((exercise, index) => (
        <SessionExerciseCard
          interval={interval}
          key={exercise.plan.id}
          exercise={exercise}
          position={block.supersetGroup ? `${block.supersetGroup}${index + 1}` : undefined}
          values={values}
          currentKey={currentKey}
          lastPerformance={lastPerformance[exercise.plan.exerciseId]}
          hold={hold}
          {...handlers}
        />
      ))}
    </section>
  );
}
