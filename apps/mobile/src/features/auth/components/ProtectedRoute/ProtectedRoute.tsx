import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../../../services/auth/AuthContext';
import { ROUTES } from '../../../../app/config/routes';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import './ProtectedRoute.css';

// Authentication only. Where an authenticated user may go is AppStateGuard's job.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
