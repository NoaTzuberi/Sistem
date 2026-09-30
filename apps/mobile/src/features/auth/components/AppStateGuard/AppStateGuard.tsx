import { Navigate, Outlet } from 'react-router-dom';
import type { AppState } from '@sistem/types';
import { useAuth } from '../../../../services/auth/AuthContext';
import { landingPath } from '../../../../app/router/landingPath';

interface AppStateGuardProps {
  allow: AppState[];
}

/**
 * Lets a route render only in the given app states and sends everyone else to
 * their own landing screen. The state comes from the server (/auth/me), never
 * from local assumptions. Use inside ProtectedRoute. The server enforces the
 * same rules on its endpoints (requireAuth / requireRole).
 */
export function AppStateGuard({ allow }: AppStateGuardProps) {
  const { user } = useAuth();

  if (!user) return null;

  if (!allow.includes(user.appState)) {
    return <Navigate to={landingPath(user.appState)} replace />;
  }

  return <Outlet />;
}
