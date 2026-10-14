import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getTrainee } from '../../../../services/coach/coachService';
import { sharedCopy, useCopy, useLoad, useServerNow } from '@sistem/shared';
import { DEFAULT_TRAINEE_TAB, ROUTES, TRAINEE_TABS, TRAINEE_TAB_PARAM, planPath } from '../../../../app/config/routes';
import type { TraineeTab } from '../../../../app/config/routes';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { useCoachData } from '../../../../services/coach/CoachDataContext';
import { OnboardingAnswers } from '../../components/OnboardingAnswers/OnboardingAnswers';
import { TraineeHeader } from '../../components/TraineeHeader/TraineeHeader';
import { TraineePlans } from '../../components/TraineePlans/TraineePlans';
import { TraineeTabs } from '../../components/TraineeTabs/TraineeTabs';
import { WorkoutLogList } from '../../components/WorkoutLogList/WorkoutLogList';
import { BodyTracking } from '../../components/BodyTracking/BodyTracking';
import { TraineeAchievements } from '../../components/TraineeAchievements/TraineeAchievements';
import { TraineeNutritionTab } from '../../../nutrition/components/TraineeNutritionTab/TraineeNutritionTab';
import { useTraineePlans } from '../../hooks/useTraineePlans';
import { traineeTabId } from '../../data/traineeTabs';
import './TraineeDetailPage.css';
import { traineesCopy } from '../../copy';

const PANEL_ID = 'trainee-tab-panel';

function isTraineeTab(value: string | null): value is TraineeTab {
  return (TRAINEE_TABS as readonly string[]).includes(value ?? '');
}

/** A trainee's profile: the header card, her sections as pill tabs, and the open section. */
export function TraineeDetailPage() {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const navigate = useNavigate();
  const { traineeId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get(TRAINEE_TAB_PARAM);
  const tab = isTraineeTab(requestedTab) ? requestedTab : DEFAULT_TRAINEE_TAB;

  const load = useCallback(() => getTrainee(traineeId), [traineeId]);
  const { data, error, isLoading, reload } = useLoad(load, shared.coach.loadTraineeError);
  const nowMs = useServerNow(data?.serverTime);
  const trainee = data?.trainee;
  const plansLoad = useTraineePlans(traineeId);
  const { weekOf } = useCoachData();
  // The header's pink pill asks the Plans tab for its week picker.
  const [wantsNewPlan, setWantsNewPlan] = useState(false);
  const handleNewPlanHandled = useCallback(() => setWantsNewPlan(false), []);

  function selectTab(next: TraineeTab) {
    setSearchParams(next === DEFAULT_TRAINEE_TAB ? {} : { [TRAINEE_TAB_PARAM]: next }, { replace: true });
  }

  // "Build plan" / "Next week": next week's plan when she already has one, else a new plan (the
  // week picker of the Plans tab — the server decides which week it offers first).
  function handleBuildPlan() {
    const nextWeekPlan = trainee?.status === 'active' ? weekOf(traineeId)?.nextWeekPlan : null;
    if (nextWeekPlan) {
      navigate(planPath(traineeId, nextWeekPlan.id));
      return;
    }
    selectTab('plans');
    setWantsNewPlan(true);
  }

  return (
    <div className="trainee-detail">
      <Link className="trainee-back" to={ROUTES.TRAINEES}>
        {copy.backToAllTrainees}
      </Link>

      {isLoading && !trainee && <p className="trainee-message">{shared.common.loading}</p>}
      {error && !trainee && (
        <p className="trainee-message" role="alert">
          {error}{' '}
          <PillButton size="sm" onClick={reload}>
            {shared.common.retry}
          </PillButton>
        </p>
      )}

      {trainee && (
        <>
          <TraineeHeader trainee={trainee} nowMs={nowMs} onBuildPlan={handleBuildPlan} />
          <TraineeTabs selected={tab} counts={{ plans: plansLoad.plans?.length }} panelId={PANEL_ID} onSelect={selectTab} />

          {/* The redesigned sections sit on the canvas (their own cards); the logs keep their content
              for now, on one white card. */}
          <section
            className={tab === 'logs' ? 'trainee-panel trainee-panel-card' : 'trainee-panel'}
            role="tabpanel"
            id={PANEL_ID}
            aria-labelledby={traineeTabId(tab)}
          >
            {tab === 'onboarding' && <OnboardingAnswers traineeId={trainee.id} onboarding={trainee.onboarding} />}
            {tab === 'plans' && <TraineePlans trainee={trainee} plansLoad={plansLoad} wantsNewPlan={wantsNewPlan}
                onNewPlanHandled={handleNewPlanHandled}
                onPlansChanged={reload} />}
            {tab === 'nutrition' && <TraineeNutritionTab traineeId={trainee.id} />}
            {tab === 'logs' && <WorkoutLogList traineeId={trainee.id} />}
            {tab === 'metrics' && <BodyTracking traineeId={trainee.id} traineeName={trainee.name} timezone={trainee.timezone} />}
            {tab === 'achievements' && <TraineeAchievements traineeId={trainee.id} />}
          </section>
        </>
      )}
    </div>
  );
}
