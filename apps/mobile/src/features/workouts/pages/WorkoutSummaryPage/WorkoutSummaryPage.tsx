import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { WorkoutLog } from '@sistem/types';
import { formatDateTime, useLoad } from '@sistem/shared';
import { IconX } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Button } from '../../../../components/common/Button/Button';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { ROUTES, workoutLogPath, workoutSessionPath } from '../../../../app/config/routes';
import { getWorkoutLog, updateWorkoutSummary } from '../../../../services/workoutLogs/workoutLogsService';
import { SummaryStats } from '../../components/SummaryStats/SummaryStats';
import { PersonalRecordList } from '../../components/PersonalRecordList/PersonalRecordList';
import { UnlockedAchievements } from '../../../achievements/components/UnlockedAchievements/UnlockedAchievements';
import { RatingPicker } from '../../components/RatingPicker/RatingPicker';
import { PumpPhotoField } from '../../components/PumpPhotoField/PumpPhotoField';
import { SUMMARY_COPY } from '../../data/workoutCopy';
import './WorkoutSummaryPage.css';

const NOTES_MAX_LENGTH = 1000;

/** Where she came from: right after Finish (→ Home) or her log page ("Add summary"). */
export interface SummaryLocationState {
  fromLog?: boolean;
}

/**
 * The workout summary (PRD §5.3), full screen: the server's stats and PRs, the
 * achievements it unlocked (Phase 11), "How was it?", notes and the Daily Pump photo. Opened
 * after Finish and again from the log page — she can change it any time.
 */
export function WorkoutSummaryPage() {
  const { logId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLog = (location.state as SummaryLocationState | null)?.fromLog === true;

  const load = useCallback(() => getWorkoutLog(logId), [logId]);
  const { data, error, reload } = useLoad(load, SUMMARY_COPY.loadError);
  // The photo changes the log right away (upload / remove); rating and notes on Save.
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isFormReady, setIsFormReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setLog(data);
    // Only the first load fills the form; a refetch (fresh photo link) keeps her edits.
    if (!isFormReady) {
      setRating(data.rating ?? null);
      setNotes(data.notes ?? '');
      setIsFormReady(true);
    }
  }, [data, isFormReady]);

  function leave() {
    navigate(fromLog ? workoutLogPath(logId) : ROUTES.TRAINEE_HOME, { replace: true });
  }

  async function save() {
    if (!log) return;
    const trimmed = notes.trim();
    const changed = rating !== (log.rating ?? null) || trimmed !== (log.notes ?? '');
    if (!changed) {
      leave();
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateWorkoutSummary(log.id, { rating, notes: trimmed === '' ? null : trimmed });
      leave();
    } catch {
      setSaveError(SUMMARY_COPY.saveError);
      setIsSaving(false);
    }
  }

  if (log?.status === 'in_progress') return <Navigate to={workoutSessionPath(log.id)} replace />;

  return (
    <AppShell hideTabBar>
      <div className="workout-summary">
        <header className="workout-summary-header">
          <button type="button" className="workout-summary-close" aria-label={SUMMARY_COPY.close} onClick={leave}>
            <IconX size={24} aria-hidden="true" />
          </button>
          <div className="workout-summary-heading">
            <h1 className="workout-summary-title">{SUMMARY_COPY.title}</h1>
            {log && (
              <span className="workout-summary-meta">
                {log.workoutTitle} · {formatDateTime(log.finishedAt ?? log.startedAt)}
              </span>
            )}
          </div>
        </header>

        {!log && !error && <StateMessage>{SUMMARY_COPY.loading}</StateMessage>}
        {!log && error && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {log && log.status !== 'completed' && <StateMessage>{SUMMARY_COPY.notFinished}</StateMessage>}

        {log && log.status === 'completed' && (
          <>
            {log.stats && <SummaryStats stats={log.stats} />}
            <PersonalRecordList log={log} title={SUMMARY_COPY.personalRecords} />
            <UnlockedAchievements achievements={log.achievements ?? []} />

            <section className="workout-summary-section" aria-labelledby="summary-rating">
              <h2 id="summary-rating" className="workout-summary-section-title">
                {SUMMARY_COPY.ratingQuestion}
              </h2>
              <RatingPicker value={rating} label={SUMMARY_COPY.ratingQuestion} onChange={setRating} />
            </section>

            <section className="workout-summary-section">
              <label htmlFor="summary-notes" className="workout-summary-section-title">
                {SUMMARY_COPY.notes}
              </label>
              <textarea
                id="summary-notes"
                className="workout-summary-notes"
                rows={3}
                maxLength={NOTES_MAX_LENGTH}
                placeholder={SUMMARY_COPY.notesPlaceholder}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </section>

            <PumpPhotoField log={log} onLogChange={setLog} onLinkExpired={reload} />
          </>
        )}
      </div>

      {/* Portaled: the page-enter animation transforms <main>, which would pin a fixed
          footer to <main> instead of the screen while it runs. */}
      {log?.status === 'completed' &&
        createPortal(
          <footer className="workout-summary-footer">
            {saveError && (
              <p className="workout-summary-error" role="alert">
                {saveError}
              </p>
            )}
            <div className="workout-summary-footer-row">
              <Button className="workout-summary-save" onClick={() => void save()} loading={isSaving}>
                {SUMMARY_COPY.save}
              </Button>
            </div>
          </footer>,
          document.body,
        )}
    </AppShell>
  );
}
