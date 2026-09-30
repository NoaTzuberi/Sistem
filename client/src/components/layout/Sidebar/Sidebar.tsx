import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/config/routes';
import { useAuth } from '../../../services/auth/AuthContext';
import { Logo } from '../../common/Logo/Logo';
import { GridIcon, DumbbellIcon, ProfileIcon, LogOutIcon } from './icons';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <GridIcon /> },
  { to: ROUTES.WORKOUTS, label: 'Workouts', icon: <DumbbellIcon /> },
  { to: ROUTES.PROFILE, label: 'Profile', icon: <ProfileIcon /> },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.LOGIN);
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <aside className="app-sidebar">
      <Link to={ROUTES.DASHBOARD} className="app-sidebar-brand">
        <Logo className="app-sidebar-wordmark" />
      </Link>

      <nav className="app-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 'app-sidebar-link' + (isActive ? ' app-sidebar-link-active' : '')}
          >
            <span className="app-sidebar-link-icon">{item.icon}</span>
            <span className="app-sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <Link to={ROUTES.PROFILE} className="app-sidebar-user">
          <span className="app-sidebar-user-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="app-sidebar-user-name">{user?.name ?? 'Account'}</span>
        </Link>
        <button type="button" className="app-sidebar-logout" onClick={handleLogout}>
          <span className="app-sidebar-link-icon">
            <LogOutIcon />
          </span>
          <span className="app-sidebar-link-label">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
