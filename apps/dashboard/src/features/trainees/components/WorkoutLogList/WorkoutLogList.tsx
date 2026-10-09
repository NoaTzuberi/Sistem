import { useCallback } from 'react';
import type { Language, WorkoutLog } from '@sistem/types';
import { listTraineeWorkoutLogs } from '../../../../services/coach/coachService';
import { describePersonalRecord, fill, formatDateTime, formatDuration, logExerciseNames, prCountLabel, sharedCopy, useCopy, useLanguage, useLoad } from '@sistem/shared';
import { Badge } from '../../../../components/common/Badge/Badge';
import { Button } from '../../../../components/common/Button/Button';
import './WorkoutLogList.css';
import { traineesCopy } from '../../copy';


interface WorkoutLogListProps {
  traineeId: string;
}

function describeSet(set: WorkoutLog['sets'][number], language: Language): string {
  const { log, units } = sharedCopy[language];
  const amount = set.durationSec !== undefined ? formatDuration(set.durationSec, language) : fill(log.reps, { reps: set.reps ?? '—' });
  return set.weight !== undefined ? `${amount} × ${set.weight} ${units.kg}` : amount;
}

export function WorkoutLogList({ traineeId }: WorkoutLogListProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const load = useCallback(() => listTraineeWorkoutLogs(traineeId), [traineeId]);
  const { data: logs, error, isLoading, reload } = useLoad(load, shared.coach.logsLoadError);

  if (isLoading && !logs) return <p className="logs-message">{shared.common.loading}</p>;
  if (error && !logs) {
    return (
      <p className="logs-message" role="alert">
        {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
      </p>
    );
  }
  if (!logs || logs.length === 0) return <p className="logs-message">{shared.coach.noLogs}</p>;

  return (
    <ul className="logs-list">
      {logs.map((log) => {
        const names = logExerciseNames(log);
        const records = log.personalRecords ?? [];
        return (
        <li key={log.id}>
          <details className="log-item">
            <summary className="log-summary">
              <span className="log-title" dir="auto">
                {log.workoutTitle}
              </span>
              <Badge tone={log.status === 'completed' ? 'accent' : 'neutral'}>{shared.coach.logStatus[log.status]}</Badge>
              <span className="log-date">{formatDateTime(log.startedAt, language)}</span>
              {log.rating !== undefined && <span className="log-rating">{fill(shared.coach.rating, { rating: log.rating })}</span>}
              {records.length > 0 && <Badge tone="accent">{prCountLabel(records.length, language)}</Badge>}
              {log.pumpPhoto && <span className="log-rating">{copy.photo}</span>}
            </summary>

            <div className="log-body">
              {log.stats && (
                <dl className="log-stats">
                  <div>
                    <dt>{shared.coach.duration}</dt>
                    <dd>{formatDuration(log.stats.durationSec, language)}</dd>
                  </div>
                  <div>
                    <dt>{shared.coach.totalVolume}</dt>
                    <dd>
                      {log.stats.totalVolume} {shared.units.kg}
                    </dd>
                  </div>
                  <div>
                    <dt>{shared.coach.setsCompleted}</dt>
                    <dd>{log.stats.setsCompleted}</dd>
                  </div>
                  <div>
                    <dt>{shared.coach.personalRecords}</dt>
                    <dd>{log.stats.prCount}</dd>
                  </div>
                </dl>
              )}

              {log.notes && <p className="log-notes" dir="auto">{log.notes}</p>}

              {records.length > 0 && (
                <ul className="log-records">
                  {records.map((record) => (
                    <li key={record.exerciseId}>{describePersonalRecord(record, names.get(record.exerciseId), language)}</li>
                  ))}
                </ul>
              )}

              {/* A short-lived signed link made for this coach only; a click opens it full size. */}
              {log.pumpPhoto ? (
                <a className="log-photo" href={log.pumpPhoto.url} target="_blank" rel="noreferrer">
                  <img src={log.pumpPhoto.url} alt={fill(shared.coach.pumpPhotoAlt, { workout: log.workoutTitle })} loading="lazy" />
                </a>
              ) : (
                <p className="log-photo-slot">{shared.coach.noPumpPhoto}</p>
              )}

              {log.sets.length > 0 && (
                <table className="log-sets">
                  <thead>
                    <tr>
                      <th scope="col">{copy.exercise}</th>
                      <th scope="col">{copy.set}</th>
                      <th scope="col">{copy.type}</th>
                      <th scope="col">{copy.performed}</th>
                      <th scope="col">{copy.done}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.sets.map((set, index) => (
                      <tr key={index}>
                        <td>
                          <bdi>{names.get(set.exerciseId) ?? shared.log.exercise}</bdi>
                        </td>
                        <td>{set.setIndex + 1}</td>
                        <td>{set.type ? shared.plan.setTypes[set.type] : '—'}</td>
                        <td>{describeSet(set, language)}</td>
                        <td>{set.completed ? shared.common.yes : shared.common.no}</td>
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
