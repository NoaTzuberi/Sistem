import { useCallback } from 'react';
import type { WorkoutLog, WorkoutLogStatus } from '@sistem/types';
import { listPlans, listTraineeWorkoutLogs } from '../../../../services/coach/coachService';
import { useLoad } from '../../../../hooks/useLoad';
import { formatDateTime, formatDuration } from '../../../../utils/format';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import './WorkoutLogList.css';

const STATUS_LABELS: Record<WorkoutLogStatus, string> = {
  in_progress: 'In progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

const SET_TYPE_LABELS: Record<string, string> = { warmup: 'Warm-up', working: 'Working', drop: 'Drop' };

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

function describeSet(set: WorkoutLog['sets'][number]): string {
  const amount = set.durationSec !== undefined ? formatDuration(set.durationSec) : `${set.reps ?? '—'} reps`;
  return set.weight !== undefined ? `${amount} × ${set.weight} kg` : amount;
}

export function WorkoutLogList({ traineeId }: WorkoutLogListProps) {
  const load = useCallback(() => loadLogs(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, "Couldn't load the workout logs.");

  if (isLoading && !data) return <p className="logs-message">Loading…</p>;
  if (error && !data) {
    return (
      <p className="logs-message" role="alert">
        {error} <Button size="sm" onClick={reload}>Try again</Button>
      </p>
    );
  }
  if (!data || data.logs.length === 0) return <p className="logs-message">No workout logs yet.</p>;

  return (
    <ul className="logs-list">
      {data.logs.map((log) => (
        <li key={log.id}>
          <details className="log-item">
            <summary className="log-summary">
              <span className="log-title">{log.workoutTitle}</span>
              <Badge tone={log.status === 'completed' ? 'accent' : 'neutral'}>{STATUS_LABELS[log.status]}</Badge>
              <span className="log-date">{formatDateTime(log.startedAt)}</span>
              {log.rating !== undefined && <span className="log-rating">Rating {log.rating}</span>}
            </summary>

            <div className="log-body">
              {log.stats && (
                <dl className="log-stats">
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

              {log.notes && <p className="log-notes">{log.notes}</p>}

              {/* Daily Pump: the photo itself needs signed URLs (Phase 9). */}
              <p className="log-photo-slot">
                {log.pumpPhoto ? `Daily Pump photo uploaded ${formatDateTime(log.pumpPhoto.uploadedAt)}` : 'No Daily Pump photo.'}
              </p>

              {log.sets.length > 0 && (
                <table className="log-sets">
                  <thead>
                    <tr>
                      <th scope="col">Exercise</th>
                      <th scope="col">Set</th>
                      <th scope="col">Type</th>
                      <th scope="col">Performed</th>
                      <th scope="col">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.sets.map((set, index) => (
                      <tr key={index}>
                        <td>{data.exerciseNames.get(set.exerciseId) ?? 'Exercise'}</td>
                        <td>{set.setIndex + 1}</td>
                        <td>{set.type ? SET_TYPE_LABELS[set.type] : '—'}</td>
                        <td>{describeSet(set)}</td>
                        <td>{set.completed ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
