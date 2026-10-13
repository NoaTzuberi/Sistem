import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { Login } from '../../features/auth/pages/Login/Login';
import { RequireCoach } from '../../features/auth/components/RequireCoach/RequireCoach';
import { AppShell } from '../../components/layout/AppShell/AppShell';
import { PagePanel } from '../../components/layout/PagePanel/PagePanel';
import { OverviewPage } from '../../features/overview/pages/OverviewPage/OverviewPage';
import { StatsPage } from '../../features/stats/pages/StatsPage/StatsPage';
import { TraineesPage } from '../../features/trainees/pages/TraineesPage/TraineesPage';
import { TraineeDetailPage } from '../../features/trainees/pages/TraineeDetailPage/TraineeDetailPage';
import { PlanBuilderPage } from '../../features/planBuilder/pages/PlanBuilderPage/PlanBuilderPage';
import { NutritionBuilderPage } from '../../features/nutrition/pages/NutritionBuilderPage/NutritionBuilderPage';
import { FoodListPage } from '../../features/nutrition/pages/FoodListPage/FoodListPage';
import { NutritionTemplatesPage } from '../../features/nutrition/pages/NutritionTemplatesPage/NutritionTemplatesPage';
import { NutritionSettingsPage } from '../../features/nutrition/pages/NutritionSettingsPage/NutritionSettingsPage';
import { ExerciseLibraryPage } from '../../features/exerciseLibrary/pages/ExerciseLibraryPage/ExerciseLibraryPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      {/* Client-side gate only; every /api/coach route checks role=coach itself. */}
      <Route element={<RequireCoach />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.HOME} element={<OverviewPage />} />
          <Route path={ROUTES.STATS} element={<StatsPage />} />
          <Route path={ROUTES.TRAINEES} element={<TraineesPage />} />
          <Route path={ROUTES.TRAINEE} element={<TraineeDetailPage />} />
          <Route path={ROUTES.PLAN} element={<PlanBuilderPage />} />
          {/* Not redesigned yet: each sits on one white panel on the canvas. */}
          <Route element={<PagePanel />}>
            <Route path={ROUTES.TRAINEE_NUTRITION} element={<NutritionBuilderPage />} />
            <Route path={ROUTES.NUTRITION} element={<Navigate to={ROUTES.NUTRITION_FOODS} replace />} />
            <Route path={ROUTES.NUTRITION_FOODS} element={<FoodListPage />} />
            <Route path={ROUTES.NUTRITION_TEMPLATES} element={<NutritionTemplatesPage />} />
            <Route path={ROUTES.NUTRITION_SETTINGS} element={<NutritionSettingsPage />} />
            <Route path={ROUTES.EXERCISES} element={<ExerciseLibraryPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
