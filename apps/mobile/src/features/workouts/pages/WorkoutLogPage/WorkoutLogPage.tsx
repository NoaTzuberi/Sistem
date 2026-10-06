import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { describeLogSet, formatDateTime, groupLogSetsByExercise, logExerciseNames, useLoad } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { PrivatePhoto } from '../../../../components/common/PrivatePhoto/PrivatePhoto';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { workoutSummaryPath } from '../../../../app/config/routes';
import { getWorkoutLog } from '../../../../services/workoutLogs/workoutLogsService';
import { BackButton } from '../../components/BackButton/BackButton';
import { PersonalRecordList } from '../../components/PersonalRecordList/PersonalRecordList';
import { SummaryStats } from '../../components/SummaryStats/SummaryStats';
import { PUMP_PHOTO_COPY, SUMMARY_COPY, WORKOUTS_COPY } from '../../data/workoutCopy';
import type { SummaryLocationState } from '../WorkoutSummaryPage/WorkoutSummaryPage';
import './WorkoutLogPage.css';

// One workout log, read-only (PRD §5.4): what was performed, the summary and the Daily
// Pump photo. The summary itself is changed on the summary screen.
export function WorkoutLogPage() {
  const { logId = '' } = useParams();
  const navigate = useNavigate();
  const load = useCallback(() => getWorkoutLog(logId), [logId]);
  const { data: log, error, isLoading, reload } = useLoad(load, WORKOUTS_COPY.logLoadError);
  const exerciseNames = log ? logExerciseNames(log) : new Map<string, string>();
  const hasFullSummary = log?.rating !== undefined && log?.notes !== undefined && log?.pumpPhoto !== null;

  function openSummary() {
    const state: SummaryLocationState = { fromLog: true };
    navigate(workoutSummaryPath(logId), { state });
  }

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
            {log.stats && <SummaryStats stats={log.stats} />}
            <PersonalRecordList log={log} title={SUMMARY_COPY.personalRecords} />

            {log.rating !== undefined && (
              <p className="workout-log-page-rating">
                {SUMMARY_COPY.rating}: {log.rating} / 5
              </p>
            )}
            {log.notes && <p className="workout-log-page-notes">{log.notes}</p>}

            {log.pumpPhoto ? (
              <PrivatePhoto
                photo={log.pumpPhoto}
                alt={PUMP_PHOTO_COPY.alt}
                openLabel={PUMP_PHOTO_COPY.open}
                closeLabel={SUMMARY_COPY.close}
                onLinkExpired={reload}
              />
            ) : (
              <p className="workout-log-page-photo-slot">{PUMP_PHOTO_COPY.noPhoto}</p>
            )}

            {log.status === 'completed' && (
              <Button variant="secondary" onClick={openSummary}>
                {hasFullSummary ? WORKOUTS_COPY.editSummary : WORKOUTS_COPY.addSummary}
              </Button>
            )}

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
