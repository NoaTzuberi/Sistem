import { Routes, Route, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import {
  ROUTES,
  WORKOUT_DETAIL_PATH,
  WORKOUT_EDIT_PATH,
  WORKOUT_SESSION_PATH,
  WORKOUT_SESSION_SUMMARY_PATH,
  ONBOARDING_EDIT_PATH,
} from '../config/routes';
import { Login } from '../../features/auth/pages/Login/Login';
import { Register } from '../../features/auth/pages/Register/Register';
import { ForgotPassword } from '../../features/auth/pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from '../../features/auth/pages/ResetPassword/ResetPassword';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute/ProtectedRoute';
import { AppStateGuard } from '../../features/auth/components/AppStateGuard/AppStateGuard';
import { RootRedirect } from '../../features/auth/components/RootRedirect/RootRedirect';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage/DashboardPage';
import { HomePage } from '../../features/home/pages/HomePage/HomePage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage/ProfilePage';
import { WorkoutsPage } from '../../features/workouts/pages/WorkoutsPage/WorkoutsPage';
import { OnboardingPage } from '../../features/onboarding/pages/OnboardingPage/OnboardingPage';
import { WorkoutBuilderPage } from '../../features/workouts/pages/WorkoutBuilderPage/WorkoutBuilderPage';
import { WorkoutTemplateDetailPage } from '../../features/workouts/pages/WorkoutTemplateDetailPage/WorkoutTemplateDetailPage';
import { ActiveWorkoutPage } from '../../features/workouts/pages/ActiveWorkoutPage/ActiveWorkoutPage';
import { WorkoutSummaryPage } from '../../features/workouts/pages/WorkoutSummaryPage/WorkoutSummaryPage';
import { InboxPage } from '../../features/coach/pages/InboxPage/InboxPage';
import { TraineesPage } from '../../features/coach/pages/TraineesPage/TraineesPage';
import { CoachProfilePage } from '../../features/coach/pages/CoachProfilePage/CoachProfilePage';

export function AppRouter() {
  const location = useLocation();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        {/* No homepage: "/" redirects by the server-decided app state (PRD §4.2). */}
        <Route path={ROUTES.HOME} element={<RootRedirect />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppStateGuard allow={['onboarding']} />}>
            <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />
          </Route>

          {/* Trainee area. 'waiting' keeps the tabs usable until Phase 4 locks it. */}
          <Route element={<AppStateGuard allow={['waiting', 'home']} />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.WORKOUTS} element={<WorkoutsPage />} />
            <Route path={ROUTES.WORKOUT_BUILDER} element={<WorkoutBuilderPage />} />
            <Route path={WORKOUT_EDIT_PATH} element={<WorkoutBuilderPage />} />
            <Route path={WORKOUT_SESSION_PATH} element={<ActiveWorkoutPage />} />
            <Route path={WORKOUT_SESSION_SUMMARY_PATH} element={<WorkoutSummaryPage />} />
            <Route path={ONBOARDING_EDIT_PATH} element={<OnboardingPage />} />
            {!backgroundLocation && (
              <Route path={WORKOUT_DETAIL_PATH} element={<WorkoutTemplateDetailPage />} />
            )}
          </Route>

          <Route element={<AppStateGuard allow={['home']} />}>
            <Route path={ROUTES.TRAINEE_HOME} element={<HomePage />} />
          </Route>

          <Route element={<AppStateGuard allow={['coach']} />}>
            <Route path={ROUTES.COACH_INBOX} element={<InboxPage />} />
            <Route path={ROUTES.COACH_TRAINEES} element={<TraineesPage />} />
            <Route path={ROUTES.COACH_PROFILE} element={<CoachProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppStateGuard allow={['waiting', 'home']} />}>
              <Route path={WORKOUT_DETAIL_PATH} element={<WorkoutTemplateDetailPage />} />
            </Route>
          </Route>
        </Routes>
      )}
    </>
  );
}
