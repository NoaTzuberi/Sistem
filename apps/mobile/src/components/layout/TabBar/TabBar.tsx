import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { IconBarbell, IconHome, IconInbox, IconUser, IconUsers } from '@tabler/icons-react';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { landingPath } from '../../../app/router/landingPath';
import './TabBar.css';

interface TabItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const ICON_SIZE = 24;

// Tabs are chosen by role (PRD §5 trainee tabs, §6 coach mode).
function tabsFor(role: 'trainee' | 'coach', homePath: string): TabItem[] {
  if (role === 'coach') {
    return [
      { to: ROUTES.COACH_INBOX, label: 'Inbox', icon: <IconInbox size={ICON_SIZE} /> },
      { to: ROUTES.COACH_TRAINEES, label: 'Trainees', icon: <IconUsers size={ICON_SIZE} /> },
      { to: ROUTES.COACH_PROFILE, label: 'Profile', icon: <IconUser size={ICON_SIZE} /> },
    ];
  }

  return [
    { to: homePath, label: 'Home', icon: <IconHome size={ICON_SIZE} /> },
    { to: ROUTES.WORKOUTS, label: 'Workouts', icon: <IconBarbell size={ICON_SIZE} /> },
    { to: ROUTES.PROFILE, label: 'Profile', icon: <IconUser size={ICON_SIZE} /> },
  ];
}

export function TabBar() {
  const { user } = useAuth();
  if (!user) return null;

  // Until a plan is published, "Home" is the waiting screen (DashboardPage for now).
  const tabs = tabsFor(user.role, landingPath(user.appState));

  return (
    <nav className="tab-bar" aria-label="Main">
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          className={({ isActive }) => 'tab-bar-link' + (isActive ? ' tab-bar-link-active' : '')}
        >
          <span className="tab-bar-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tab-bar-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
