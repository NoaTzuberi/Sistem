import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { describeLogSet, formatDateTime, formatDuration, groupLogSetsByExercise, useLoad } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { getWorkoutLog } from '../../../../services/workoutLogs/workoutLogsService';
import { BackButton } from '../../components/BackButton/BackButton';
import { WORKOUTS_COPY } from '../../data/workoutCopy';
import './WorkoutLogPage.css';

// One workout log, read-only (PRD §5.4): what was performed and the summary.
export function WorkoutLogPage() {
  const { logId = '' } = useParams();
  const load = useCallback(() => getWorkoutLog(logId), [logId]);
  const { data: log, error, isLoading, reload } = useLoad(load, WORKOUTS_COPY.logLoadError);
  const exerciseNames = new Map(log?.exercises?.map((exercise) => [exercise.id, exercise.name]));

  return (
    <AppShell>
      <div className="workout-log-page">
        <header className="workout-log-page-header">
          <BackButton />
          {log && (
            <div className="workout-log-page-heading">
              <h1 className="workout-log-page-title">{log.workoutTitle}</h1>
              <span className="workout-log-page-date">{formatDateTime(log.finishedAt ?? log.startedAt)}</span>
            </div>
          )}
        </header>

        {isLoading && !log && <StateMessage>{WORKOUTS_COPY.loading}</StateMessage>}
        {error && !log && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {log && (
          <>
            {(log.stats || log.rating !== undefined) && (
              <dl className="workout-log-page-stats">
                {log.stats && (
                  <>
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
                  </>
                )}
                {log.rating !== undefined && (
                  <div>
                    <dt>Rating</dt>
                    <dd>{log.rating} / 5</dd>
                  </div>
                )}
              </dl>
            )}

            {log.notes && <p className="workout-log-page-notes">{log.notes}</p>}

            {/* Daily Pump: the photo itself needs signed URLs (Phase 9). */}
            <p className="workout-log-page-photo-slot">
              {log.pumpPhoto
                ? `${WORKOUTS_COPY.pumpPhotoUploaded} ${formatDateTime(log.pumpPhoto.uploadedAt)}`
                : WORKOUTS_COPY.noPumpPhoto}
            </p>

            <ul className="workout-log-page-exercises">
              {groupLogSetsByExercise(log.sets).map((group, index) => (
                <li key={index} className="workout-log-page-exercise">
                  <span className="workout-log-page-exercise-name">{exerciseNames.get(group.exerciseId) ?? 'Exercise'}</span>
                  {group.sets.map((set) => (
                    <span key={set.setIndex} className="workout-log-page-set">
                      {describeLogSet(set)}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
