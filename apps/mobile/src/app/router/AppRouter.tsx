import { Routes, Route } from 'react-router-dom';
import {
  ROUTES,
  COACH_TRAINEE_PATH,
  WORKOUT_DETAIL_PATH,
  WORKOUT_LOG_PATH,
  ONBOARDING_EDIT_PATH,
} from '../config/routes';
import { Login } from '../../features/auth/pages/Login/Login';
import { Register } from '../../features/auth/pages/Register/Register';
import { ForgotPassword } from '../../features/auth/pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from '../../features/auth/pages/ResetPassword/ResetPassword';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute/ProtectedRoute';
import { AppStateGuard } from '../../features/auth/components/AppStateGuard/AppStateGuard';
import { RootRedirect } from '../../features/auth/components/RootRedirect/RootRedirect';
import { WaitingPage } from '../../features/waiting/pages/WaitingPage/WaitingPage';
import { HomePage } from '../../features/home/pages/HomePage/HomePage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage/ProfilePage';
import { WorkoutsPage } from '../../features/workouts/pages/WorkoutsPage/WorkoutsPage';
import { OnboardingPage } from '../../features/onboarding/pages/OnboardingPage/OnboardingPage';
import { WorkoutDetailPage } from '../../features/workouts/pages/WorkoutDetailPage/WorkoutDetailPage';
import { WorkoutLogPage } from '../../features/workouts/pages/WorkoutLogPage/WorkoutLogPage';
import { InboxPage } from '../../features/coach/pages/InboxPage/InboxPage';
import { TraineesPage } from '../../features/coach/pages/TraineesPage/TraineesPage';
import { TraineeDetailPage } from '../../features/coach/pages/TraineeDetailPage/TraineeDetailPage';
import { CoachProfilePage } from '../../features/coach/pages/CoachProfilePage/CoachProfilePage';

export function AppRouter() {
  return (
    <Routes>
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

        {/* Until a plan is published, the waiting screen is the only trainee screen. */}
        <Route element={<AppStateGuard allow={['waiting']} />}>
          <Route path={ROUTES.WAITING} element={<WaitingPage />} />
        </Route>

        <Route element={<AppStateGuard allow={['home']} />}>
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.WORKOUTS} element={<WorkoutsPage />} />
          <Route path={WORKOUT_DETAIL_PATH} element={<WorkoutDetailPage />} />
          <Route path={WORKOUT_LOG_PATH} element={<WorkoutLogPage />} />
          <Route path={ONBOARDING_EDIT_PATH} element={<OnboardingPage />} />
          <Route path={ROUTES.TRAINEE_HOME} element={<HomePage />} />
        </Route>

        <Route element={<AppStateGuard allow={['coach']} />}>
          <Route path={ROUTES.COACH_INBOX} element={<InboxPage />} />
          <Route path={ROUTES.COACH_TRAINEES} element={<TraineesPage />} />
          <Route path={COACH_TRAINEE_PATH} element={<TraineeDetailPage />} />
          <Route path={ROUTES.COACH_PROFILE} element={<CoachProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>

  );
}
