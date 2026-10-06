import { useCallback } from 'react';
import type { WorkoutLog, WorkoutLogStatus } from '@sistem/types';
import { listTraineeWorkoutLogs } from '../../../../services/coach/coachService';
import { useLoad, formatDateTime, formatDuration, describePersonalRecord, logExerciseNames, prCountLabel } from '@sistem/shared';
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

function describeSet(set: WorkoutLog['sets'][number]): string {
  const amount = set.durationSec !== undefined ? formatDuration(set.durationSec) : `${set.reps ?? '—'} reps`;
  return set.weight !== undefined ? `${amount} × ${set.weight} kg` : amount;
}

export function WorkoutLogList({ traineeId }: WorkoutLogListProps) {
  const load = useCallback(() => listTraineeWorkoutLogs(traineeId), [traineeId]);
  const { data: logs, error, isLoading, reload } = useLoad(load, "Couldn't load the workout logs.");

  if (isLoading && !logs) return <p className="logs-message">Loading…</p>;
  if (error && !logs) {
    return (
      <p className="logs-message" role="alert">
        {error} <Button size="sm" onClick={reload}>Try again</Button>
      </p>
    );
  }
  if (!logs || logs.length === 0) return <p className="logs-message">No workout logs yet.</p>;

  return (
    <ul className="logs-list">
      {logs.map((log) => {
        const names = logExerciseNames(log);
        const records = log.personalRecords ?? [];
        return (
        <li key={log.id}>
          <details className="log-item">
            <summary className="log-summary">
              <span className="log-title">{log.workoutTitle}</span>
              <Badge tone={log.status === 'completed' ? 'accent' : 'neutral'}>{STATUS_LABELS[log.status]}</Badge>
              <span className="log-date">{formatDateTime(log.startedAt)}</span>
              {log.rating !== undefined && <span className="log-rating">Rating {log.rating}</span>}
              {records.length > 0 && <Badge tone="accent">{prCountLabel(records.length)}</Badge>}
              {log.pumpPhoto && <span className="log-rating">Photo</span>}
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

              {records.length > 0 && (
                <ul className="log-records">
                  {records.map((record) => (
                    <li key={record.exerciseId}>{describePersonalRecord(record, names.get(record.exerciseId))}</li>
                  ))}
                </ul>
              )}

              {/* A short-lived signed link made for this coach only; a click opens it full size. */}
              {log.pumpPhoto ? (
                <a className="log-photo" href={log.pumpPhoto.url} target="_blank" rel="noreferrer">
                  <img src={log.pumpPhoto.url} alt={`Daily Pump photo — ${log.workoutTitle}`} loading="lazy" />
                </a>
              ) : (
                <p className="log-photo-slot">No Daily Pump photo.</p>
              )}

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
                        <td>{names.get(set.exerciseId) ?? 'Exercise'}</td>
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
        );
      })}
    </ul>
  );
}
