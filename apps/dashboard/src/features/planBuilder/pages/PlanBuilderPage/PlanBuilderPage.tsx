import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlan, getTrainee } from '../../../../services/coach/coachService';
import { useLoad } from '@sistem/shared';
import { traineePath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { PlanEditor } from '../../components/PlanEditor/PlanEditor';
import './PlanBuilderPage.css';

/** Loads the plan and its trainee, then hands them to the editor. */
export function PlanBuilderPage() {
  const { traineeId = '', planId = '' } = useParams();
  const load = useCallback(
    async () => {
      const [plan, { trainee }] = await Promise.all([getPlan(traineeId, planId), getTrainee(traineeId)]);
      return { plan, trainee };
    },
    [traineeId, planId],
  );
  const { data, error, isLoading, reload } = useLoad(load, "Couldn't load this plan.");

  if (!data) {
    return (
      <div className="plan-builder-state">
        <Link to={traineePath(traineeId, 'plans')}>← Back to the trainee</Link>
        {isLoading && <p>Loading…</p>}
        {error && (
          <p role="alert">
            {error} <Button size="sm" onClick={reload}>Try again</Button>
          </p>
        )}
      </div>
    );
  }

  // Keyed by plan: another plan starts with a fresh editor (draft, save state).
  return (
    <PlanEditor
      key={data.plan.id}
      traineeId={traineeId}
      traineeName={data.trainee.name}
      currentWeekStart={data.trainee.currentWeekStart}
      initialPlan={data.plan}
    />
  );
}
