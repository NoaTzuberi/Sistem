import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { Logo } from '../../common/Logo/Logo';
import { Button } from '../../common/Button/Button';
import { NotificationBell } from '../../../features/notifications/components/NotificationBell/NotificationBell';
import './DashboardShell.css';

/** The frame around every signed-in page: top bar + the routed page. */
export function DashboardShell() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-shell">
      <header className="shell-bar">
        <div className="shell-brand">
          <Logo variant="mark" />
          <nav className="shell-nav" aria-label="Main">
            <NavLink className="shell-link" to={ROUTES.TRAINEES}>
              Trainees
            </NavLink>
          </nav>
        </div>
        <div className="shell-actions">
          <NotificationBell />
          <span className="shell-user">{user?.name}</span>
          <Button size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
