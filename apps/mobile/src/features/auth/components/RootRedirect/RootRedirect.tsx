import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../../services/auth/AuthContext';
import { ROUTES } from '../../../../app/config/routes';
import { landingPath } from '../../../../app/router/landingPath';

// "/" has no screen of its own: it sends each user to where their state belongs.
export function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return <Navigate to={user ? landingPath(user.appState) : ROUTES.LOGIN} replace />;
}
