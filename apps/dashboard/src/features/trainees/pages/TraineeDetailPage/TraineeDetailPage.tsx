import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getTrainee } from '../../../../services/coach/coachService';
import { sharedCopy, useCopy, useLoad, useServerNow } from '@sistem/shared';
import { DEFAULT_TRAINEE_TAB, ROUTES, TRAINEE_TABS, TRAINEE_TAB_PARAM } from '../../../../app/config/routes';
import type { TraineeTab } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { TraineeStatusBadges, PlanWindow } from '../../components/TraineeStatusBadges/TraineeStatusBadges';
import { OnboardingAnswers } from '../../components/OnboardingAnswers/OnboardingAnswers';
import { TraineePlans } from '../../components/TraineePlans/TraineePlans';
import { WorkoutLogList } from '../../components/WorkoutLogList/WorkoutLogList';
import { BodyTracking } from '../../components/BodyTracking/BodyTracking';
import { TraineeAchievements } from '../../components/TraineeAchievements/TraineeAchievements';
import { TraineeNutritionTab } from '../../../nutrition/components/TraineeNutritionTab/TraineeNutritionTab';
import './TraineeDetailPage.css';
import { traineesCopy } from '../../copy';

function tabLabel(tab: TraineeTab, copy: (typeof traineesCopy)['he'], shared: (typeof sharedCopy)['he']): string {
  if (tab === 'logs') return copy.workoutLogs;
  if (tab === 'metrics') return shared.coach.tabs.body;
  return shared.coach.tabs[tab];
}

function isTraineeTab(value: string | null): value is TraineeTab {
  return (TRAINEE_TABS as readonly string[]).includes(value ?? '');
}

export function TraineeDetailPage() {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const { traineeId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get(TRAINEE_TAB_PARAM);
  const tab = isTraineeTab(requestedTab) ? requestedTab : DEFAULT_TRAINEE_TAB;

  const load = useCallback(() => getTrainee(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, shared.coach.loadTraineeError);
  const nowMs = useServerNow(data?.serverTime);
  const trainee = data?.trainee;

  function selectTab(next: TraineeTab) {
    setSearchParams(next === DEFAULT_TRAINEE_TAB ? {} : { [TRAINEE_TAB_PARAM]: next }, { replace: true });
  }

  return (
    <div className="trainee-detail">
      <Link className="trainee-back" to={ROUTES.TRAINEES}>
        {copy.backToTrainees}
      </Link>

      {isLoading && !trainee && <p className="trainee-message">{shared.common.loading}</p>}
      {error && !trainee && (
        <p className="trainee-message" role="alert">
          {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
        </p>
      )}

      {trainee && (
        <>
          <header className="trainee-header">
            <h1 className="trainee-name" dir="auto">{trainee.name}</h1>
            <TraineeStatusBadges trainee={trainee} />
            <dl className="trainee-facts">
              <div>
                <dt>{copy.email}</dt>
                <dd>{trainee.email}</dd>
              </div>
              <div>
                <dt>{copy.timezone}</dt>
                <dd>{trainee.timezone}</dd>
              </div>
              {trainee.planDueAt && (
                <div>
                  <dt>{copy.window48h}</dt>
                  <dd>
                    <PlanWindow planDueAt={trainee.planDueAt} nowMs={nowMs} />
                  </dd>
                </div>
              )}
            </dl>
          </header>

          <div className="trainee-tabs" role="tablist" aria-label={shared.coach.sectionsLabel}>
            {TRAINEE_TABS.map((id) => (
              <button
                key={id}
                className="trainee-tab"
                type="button"
                role="tab"
                id={`trainee-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="trainee-tab-panel"
                onClick={() => selectTab(id)}
              >
                {tabLabel(id, copy, shared)}
              </button>
            ))}
          </div>

          <section className="trainee-panel" role="tabpanel" id="trainee-tab-panel" aria-labelledby={`trainee-tab-${tab}`}>
            {tab === 'onboarding' && <OnboardingAnswers onboarding={trainee.onboarding} />}
            {tab === 'plans' && <TraineePlans trainee={trainee} onPlansChanged={reload} />}
            {tab === 'nutrition' && <TraineeNutritionTab traineeId={trainee.id} />}
            {tab === 'logs' && <WorkoutLogList traineeId={trainee.id} />}
            {tab === 'metrics' && <BodyTracking traineeId={trainee.id} timezone={trainee.timezone} />}
            {tab === 'achievements' && <TraineeAchievements traineeId={trainee.id} />}
          </section>
        </>
      )}
    </div>
  );
}
