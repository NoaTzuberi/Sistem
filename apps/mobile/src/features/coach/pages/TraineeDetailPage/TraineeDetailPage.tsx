import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLoad, useServerNow } from '@sistem/shared';
import { IconChevronLeft } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { getTrainee } from '../../../../services/coach/coachService';
import { ROUTES } from '../../../../app/config/routes';
import {
  DEFAULT_TRAINEE_TAB,
  TRAINEE_TABS,
  TRAINEE_TAB_LABELS,
  TRAINEE_TAB_PARAM,
  isTraineeTab,
} from '../../data/traineeTabs';
import type { TraineeTab } from '../../data/traineeTabs';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { PlanWindow, TraineeStatusBadges } from '../../components/TraineeStatusBadges/TraineeStatusBadges';
import { OnboardingAnswers } from '../../components/OnboardingAnswers/OnboardingAnswers';
import { TraineePlan } from '../../components/TraineePlan/TraineePlan';
import { WorkoutLogList } from '../../components/WorkoutLogList/WorkoutLogList';
import { TraineeBodyTracking } from '../../components/TraineeBodyTracking/TraineeBodyTracking';
import './TraineeDetailPage.css';

// Coach mode: one trainee (PRD §6). The server answers 404 for a trainee who is not
// this coach's, which shows as the load error.
export function TraineeDetailPage() {
  const { traineeId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get(TRAINEE_TAB_PARAM);
  const tab = isTraineeTab(requestedTab) ? requestedTab : DEFAULT_TRAINEE_TAB;

  const load = useCallback(() => getTrainee(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, "Couldn't load this trainee.");
  const nowMs = useServerNow(data?.serverTime);
  const trainee = data?.trainee;

  function selectTab(next: TraineeTab) {
    setSearchParams(next === DEFAULT_TRAINEE_TAB ? {} : { [TRAINEE_TAB_PARAM]: next }, { replace: true });
  }

  return (
    <AppShell>
      <div className="coach-trainee">
        <header className="coach-trainee-header">
          <Link className="coach-trainee-back" to={ROUTES.COACH_TRAINEES} aria-label="Back to trainees">
            <IconChevronLeft size={24} aria-hidden="true" />
          </Link>
          {trainee && (
            <div className="coach-trainee-heading">
              <h1 className="coach-trainee-name">{trainee.name}</h1>
              <span className="coach-trainee-email">{trainee.email}</span>
              <TraineeStatusBadges trainee={trainee} />
              {trainee.planDueAt && <PlanWindow planDueAt={trainee.planDueAt} nowMs={nowMs} />}
            </div>
          )}
        </header>

        {isLoading && !trainee && <StateMessage>Loading…</StateMessage>}
        {error && !trainee && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {trainee && (
          <>
            <div className="coach-trainee-tabs" role="tablist" aria-label="Trainee sections">
              {TRAINEE_TABS.map((id) => (
                <button
                  key={id}
                  className="coach-trainee-tab"
                  type="button"
                  role="tab"
                  id={`coach-trainee-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="coach-trainee-panel"
                  onClick={() => selectTab(id)}
                >
                  {TRAINEE_TAB_LABELS[id]}
                </button>
              ))}
            </div>

            <section role="tabpanel" id="coach-trainee-panel" aria-labelledby={`coach-trainee-tab-${tab}`}>
              {tab === 'onboarding' && <OnboardingAnswers onboarding={trainee.onboarding} />}
              {tab === 'plan' && <TraineePlan trainee={trainee} onPlansChanged={reload} />}
              {tab === 'logs' && <WorkoutLogList traineeId={trainee.id} />}
              {tab === 'body' && <TraineeBodyTracking traineeId={trainee.id} timezone={trainee.timezone} />}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
