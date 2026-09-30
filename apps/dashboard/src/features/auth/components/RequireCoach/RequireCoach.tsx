import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../../services/auth/AuthContext';
import { ROUTES } from '../../../../app/config/routes';
import './RequireCoach.css';

export function RequireCoach() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="require-coach-loading">Loading…</p>;
  }

  if (user?.role !== 'coach') {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
