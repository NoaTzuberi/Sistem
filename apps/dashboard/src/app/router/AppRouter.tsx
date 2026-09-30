import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { Login } from '../../features/auth/pages/Login/Login';
import { RequireCoach } from '../../features/auth/components/RequireCoach/RequireCoach';
import { HomePage } from '../../features/home/pages/HomePage/HomePage';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route element={<RequireCoach />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
