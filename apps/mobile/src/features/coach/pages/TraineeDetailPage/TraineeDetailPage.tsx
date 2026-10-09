import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { sharedCopy, useCopy, useLoad, useServerNow } from '@sistem/shared';
import { IconChevronLeft } from '@tabler/icons-react';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { getTrainee } from '../../../../services/coach/coachService';
import { ROUTES } from '../../../../app/config/routes';
import {
  DEFAULT_TRAINEE_TAB,
  TRAINEE_TABS,
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
import { TraineeAchievements } from '../../components/TraineeAchievements/TraineeAchievements';
import { TraineeNutrition } from '../../components/TraineeNutrition/TraineeNutrition';
import { TraineeTracking } from '../../components/TraineeTracking/TraineeTracking';
import './TraineeDetailPage.css';

// Coach mode: one trainee (PRD §6). The server answers 404 for a trainee who is not
// this coach's, which shows as the load error.
export function TraineeDetailPage() {
  const { traineeId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get(TRAINEE_TAB_PARAM);
  const tab = isTraineeTab(requestedTab) ? requestedTab : DEFAULT_TRAINEE_TAB;

  const shared = useCopy(sharedCopy);
  const copy = shared.coach;
  const load = useCallback(() => getTrainee(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, copy.loadTraineeError);
  const nowMs = useServerNow(data?.serverTime);
  const trainee = data?.trainee;

  function selectTab(next: TraineeTab) {
    setSearchParams(next === DEFAULT_TRAINEE_TAB ? {} : { [TRAINEE_TAB_PARAM]: next }, { replace: true });
  }

  return (
    <AppShell>
      <div className="coach-trainee">
        <header className="coach-trainee-header">
          <Link className="coach-trainee-back" to={ROUTES.COACH_TRAINEES} aria-label={copy.backToTrainees}>
            <IconChevronLeft className="flip-rtl" size={24} aria-hidden="true" />
          </Link>
          {trainee && (
            <div className="coach-trainee-heading">
              <h1 className="coach-trainee-name" dir="auto">
                {trainee.name}
              </h1>
              <span className="coach-trainee-email" dir="ltr">
                {trainee.email}
              </span>
              <TraineeStatusBadges trainee={trainee} />
              {trainee.planDueAt && <PlanWindow planDueAt={trainee.planDueAt} nowMs={nowMs} />}
            </div>
          )}
        </header>

        {isLoading && !trainee && <StateMessage>{shared.common.loading}</StateMessage>}
        {error && !trainee && <StateMessage onRetry={reload}>{error}</StateMessage>}

        {trainee && (
          <>
            <div className="coach-trainee-tabs" role="tablist" aria-label={copy.sectionsLabel}>
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
                  {copy.tabs[id]}
                </button>
              ))}
            </div>

            <section role="tabpanel" id="coach-trainee-panel" aria-labelledby={`coach-trainee-tab-${tab}`}>
              {tab === 'onboarding' && <OnboardingAnswers onboarding={trainee.onboarding} />}
              {tab === 'plan' && <TraineePlan trainee={trainee} onPlansChanged={reload} />}
              {tab === 'nutrition' && <TraineeNutrition traineeId={trainee.id} />}
              {tab === 'tracking' && <TraineeTracking traineeId={trainee.id} />}
              {tab === 'logs' && <WorkoutLogList traineeId={trainee.id} />}
              {tab === 'body' && <TraineeBodyTracking traineeId={trainee.id} timezone={trainee.timezone} />}
              {tab === 'achievements' && <TraineeAchievements traineeId={trainee.id} />}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
