import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { Login } from '../../features/auth/pages/Login/Login';
import { RequireCoach } from '../../features/auth/components/RequireCoach/RequireCoach';
import { DashboardShell } from '../../components/layout/DashboardShell/DashboardShell';
import { TraineesPage } from '../../features/trainees/pages/TraineesPage/TraineesPage';
import { TraineeDetailPage } from '../../features/trainees/pages/TraineeDetailPage/TraineeDetailPage';
import { PlanBuilderPage } from '../../features/planBuilder/pages/PlanBuilderPage/PlanBuilderPage';
import { NutritionBuilderPage } from '../../features/nutrition/pages/NutritionBuilderPage/NutritionBuilderPage';
import { FoodListPage } from '../../features/nutrition/pages/FoodListPage/FoodListPage';
import { NutritionTemplatesPage } from '../../features/nutrition/pages/NutritionTemplatesPage/NutritionTemplatesPage';
import { NutritionSettingsPage } from '../../features/nutrition/pages/NutritionSettingsPage/NutritionSettingsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      {/* Client-side gate only; every /api/coach route checks role=coach itself. */}
      <Route element={<RequireCoach />}>
        <Route element={<DashboardShell />}>
          <Route path={ROUTES.TRAINEES} element={<TraineesPage />} />
          <Route path={ROUTES.TRAINEE} element={<TraineeDetailPage />} />
          <Route path={ROUTES.PLAN} element={<PlanBuilderPage />} />
          <Route path={ROUTES.TRAINEE_NUTRITION} element={<NutritionBuilderPage />} />
          <Route path={ROUTES.NUTRITION} element={<Navigate to={ROUTES.NUTRITION_FOODS} replace />} />
          <Route path={ROUTES.NUTRITION_FOODS} element={<FoodListPage />} />
          <Route path={ROUTES.NUTRITION_TEMPLATES} element={<NutritionTemplatesPage />} />
          <Route path={ROUTES.NUTRITION_SETTINGS} element={<NutritionSettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.TRAINEES} replace />} />
    </Routes>
  );
}
