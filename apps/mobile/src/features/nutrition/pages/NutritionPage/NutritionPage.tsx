import { useLoad } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { getNutritionPlan } from '../../../../services/nutrition/nutritionService';
import { NutritionPlanView } from '../../components/NutritionPlanView/NutritionPlanView';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './NutritionPage.css';

// Trainee Nutrition tab (PRD §5.6): her coach's newest published plan. Portions are the
// focus — calorie numbers never reach this screen (the server doesn't send them).
export function NutritionPage() {
  const { data, error, isLoading, reload } = useLoad(getNutritionPlan, NUTRITION_COPY.loadError);

  return (
    <AppShell>
      <div className="nutrition-page">
        <h1 className="nutrition-page-title">{NUTRITION_COPY.title}</h1>

        {isLoading && !data && <StateMessage>{NUTRITION_COPY.loading}</StateMessage>}
        {error && !data && <StateMessage onRetry={reload}>{error}</StateMessage>}
        {data && !data.plan && <StateMessage>{NUTRITION_COPY.empty}</StateMessage>}
        {data?.plan && <NutritionPlanView plan={data.plan} />}
      </div>
    </AppShell>
  );
}
