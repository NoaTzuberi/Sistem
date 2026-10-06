import { useCallback } from 'react';
import type { WorkoutLogStatus } from '@sistem/types';
import {
  describeLogSet,
  describePersonalRecord,
  formatDateTime,
  formatDuration,
  groupLogSetsByExercise,
  logExerciseNames,
  prCountLabel,
  useLoad,
} from '@sistem/shared';
import { IconCamera, IconChevronDown } from '@tabler/icons-react';
import { listTraineeWorkoutLogs } from '../../../../services/coach/coachService';
import { Badge } from '../../../../components/common/Badge/Badge';
import { PrivatePhoto } from '../../../../components/common/PrivatePhoto/PrivatePhoto';
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

// The trainee's logs with their summaries (PRD §6): stats, PRs, rating, notes and the
// Daily Pump photo — a short-lived signed link the server makes for her coach only.
export function WorkoutLogList({ traineeId }: WorkoutLogListProps) {
  const load = useCallback(() => listTraineeWorkoutLogs(traineeId), [traineeId]);
  const { data: logs, error, isLoading, reload } = useLoad(load, "Couldn't load the workout logs.");

  if (isLoading && !logs) return <StateMessage>Loading…</StateMessage>;
  if (!logs) return <StateMessage onRetry={reload}>{error}</StateMessage>;
  if (logs.length === 0) return <StateMessage>No workout logs yet.</StateMessage>;

  return (
    <ul className="workout-logs">
      {logs.map((log) => {
        const names = logExerciseNames(log);
        const records = log.personalRecords ?? [];
        return (
          <li key={log.id}>
            <details className="workout-log">
              <summary className="workout-log-summary">
                <span className="workout-log-heading">
                  <span className="workout-log-title">{log.workoutTitle}</span>
                  <span className="workout-log-date">{formatDateTime(log.startedAt)}</span>
                  <span className="workout-log-badges">
                    <Badge variant={log.status === 'completed' ? 'accent' : 'neutral'}>{STATUS_LABELS[log.status]}</Badge>
                    {log.rating !== undefined && <Badge variant="neutral">Rating {log.rating}</Badge>}
                    {records.length > 0 && <Badge variant="accent">{prCountLabel(records.length)}</Badge>}
                    {log.pumpPhoto && (
                      <Badge variant="neutral" aria-label="Has a Daily Pump photo">
                        <IconCamera size={14} aria-hidden="true" />
                      </Badge>
                    )}
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

                {records.length > 0 && (
                  <ul className="workout-log-records">
                    {records.map((record) => (
                      <li key={record.exerciseId}>{describePersonalRecord(record, names.get(record.exerciseId))}</li>
                    ))}
                  </ul>
                )}

                {log.notes && <p className="workout-log-notes">{log.notes}</p>}

                {log.pumpPhoto ? (
                  <PrivatePhoto
                    photo={log.pumpPhoto}
                    alt={`Daily Pump photo — ${log.workoutTitle}`}
                    openLabel="Open the Daily Pump photo"
                    closeLabel="Close"
                    onLinkExpired={reload}
                  />
                ) : (
                  <p className="workout-log-photo-slot">No Daily Pump photo.</p>
                )}

                {groupLogSetsByExercise(log.sets).map((group, index) => (
                  <div key={index} className="workout-log-exercise">
                    <span className="workout-log-exercise-name">{names.get(group.exerciseId) ?? 'Exercise'}</span>
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
        );
      })}
    </ul>
  );
}
