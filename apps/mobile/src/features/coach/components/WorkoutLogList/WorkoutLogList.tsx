import { useCallback } from 'react';
import type { WorkoutLogStatus } from '@sistem/types';
import { describeLogSet, formatDateTime, formatDuration, groupLogSetsByExercise, useLoad } from '@sistem/shared';
import { IconChevronDown } from '@tabler/icons-react';
import { listPlans, listTraineeWorkoutLogs } from '../../../../services/coach/coachService';
import { Badge } from '../../../../components/common/Badge/Badge';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import './WorkoutLogList.css';

const STATUS_LABELS: Record<WorkoutLogStatus, string> = {
  in_progress: 'In progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

interface WorkoutLogListProps {
  traineeId: string;
}

async function loadLogs(traineeId: string) {
  // Logs only carry exercise ids; the names come from the plans they were logged from.
  const [logs, plans] = await Promise.all([listTraineeWorkoutLogs(traineeId), listPlans(traineeId)]);
  const exerciseNames = new Map<string, string>();
  for (const plan of plans) {
    for (const workout of plan.workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.exercise) exerciseNames.set(exercise.exerciseId, exercise.exercise.name);
      }
    }
  }
  return { logs, exerciseNames };
}

export function WorkoutLogList({ traineeId }: WorkoutLogListProps) {
  const load = useCallback(() => loadLogs(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, "Couldn't load the workout logs.");

  if (isLoading && !data) return <StateMessage>Loading…</StateMessage>;
  if (!data) return <StateMessage onRetry={reload}>{error}</StateMessage>;
  if (data.logs.length === 0) return <StateMessage>No workout logs yet.</StateMessage>;

  return (
    <ul className="workout-logs">
      {data.logs.map((log) => (
        <li key={log.id}>
          <details className="workout-log">
            <summary className="workout-log-summary">
              <span className="workout-log-heading">
                <span className="workout-log-title">{log.workoutTitle}</span>
                <span className="workout-log-date">{formatDateTime(log.startedAt)}</span>
                <span className="workout-log-badges">
                  <Badge variant={log.status === 'completed' ? 'accent' : 'neutral'}>{STATUS_LABELS[log.status]}</Badge>
                  {log.rating !== undefined && <Badge variant="neutral">Rating {log.rating}</Badge>}
                </span>
              </span>
              <IconChevronDown className="workout-log-chevron" size={20} aria-hidden="true" />
            </summary>

            <div className="workout-log-body">
              {log.stats && (
                <dl className="workout-log-stats">
                  <div>
                    <dt>Duration</dt>
                    <dd>{formatDuration(log.stats.durationSec)}</dd>
                  </div>
                  <div>
                    <dt>Total volume</dt>
                    <dd>{log.stats.totalVolume} kg</dd>
                  </div>
                  <div>
                    <dt>Sets completed</dt>
                    <dd>{log.stats.setsCompleted}</dd>
                  </div>
                  <div>
                    <dt>Personal records</dt>
                    <dd>{log.stats.prCount}</dd>
                  </div>
                </dl>
              )}

              {log.notes && <p className="workout-log-notes">{log.notes}</p>}

              {/* Daily Pump: the photo itself needs signed URLs (Phase 9). */}
              <p className="workout-log-photo-slot">
                {log.pumpPhoto ? `Daily Pump photo uploaded ${formatDateTime(log.pumpPhoto.uploadedAt)}` : 'No Daily Pump photo.'}
              </p>

              {groupLogSetsByExercise(log.sets).map((group, index) => (
                <div key={index} className="workout-log-exercise">
                  <span className="workout-log-exercise-name">{data.exerciseNames.get(group.exerciseId) ?? 'Exercise'}</span>
                  {group.sets.map((set) => (
                    <span key={set.setIndex} className="workout-log-set">
                      {describeLogSet(set)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
