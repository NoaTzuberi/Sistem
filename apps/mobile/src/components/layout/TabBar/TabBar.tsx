import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { TabUpdates, UpdateTab } from '@sistem/types';
import { IconBarbell, IconHome, IconInbox, IconSalad, IconUser, IconUsers } from '@tabler/icons-react';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { UnreadBadge } from '../../../features/notifications/components/UnreadBadge/UnreadBadge';
import { TabUpdateDot } from '../../../features/nutrition/components/TabUpdateDot/TabUpdateDot';
import { clearTabUpdate, useTabUpdates } from '../../../features/nutrition/tabUpdates';
import { NUTRITION_COPY } from '../../../features/nutrition/data/nutritionCopy';
import './TabBar.css';

interface TabItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Drawn on the icon's corner (the Inbox unread count, a trainee tab's update dot). */
  badge?: ReactNode;
}

const ICON_SIZE = 24;

// Tabs are chosen by role (PRD §5 trainee tabs, §6 coach mode).
function tabsFor(role: 'trainee' | 'coach', updates: TabUpdates): TabItem[] {
  if (role === 'coach') {
    return [
      { to: ROUTES.COACH_INBOX, label: 'Inbox', icon: <IconInbox size={ICON_SIZE} />, badge: <UnreadBadge /> },
      { to: ROUTES.COACH_TRAINEES, label: 'Trainees', icon: <IconUsers size={ICON_SIZE} /> },
      { to: ROUTES.COACH_PROFILE, label: 'Profile', icon: <IconUser size={ICON_SIZE} /> },
    ];
  }

  return [
    { to: ROUTES.TRAINEE_HOME, label: 'Home', icon: <IconHome size={ICON_SIZE} /> },
    {
      to: ROUTES.WORKOUTS,
      label: 'Workouts',
      icon: <IconBarbell size={ICON_SIZE} />,
      badge: <TabUpdateDot visible={updates.workouts} />,
    },
    {
      to: ROUTES.NUTRITION,
      label: NUTRITION_COPY.tabLabel,
      icon: <IconSalad size={ICON_SIZE} />,
      badge: <TabUpdateDot visible={updates.nutrition} />,
    },
    { to: ROUTES.PROFILE, label: 'Profile', icon: <IconUser size={ICON_SIZE} /> },
  ];
}

/** The tab whose screens she is on (its detail screens count as opening it). */
function openTab(pathname: string): UpdateTab | null {
  if (pathname === ROUTES.WORKOUTS || pathname.startsWith(`${ROUTES.WORKOUTS}/`)) return 'workouts';
  if (pathname === ROUTES.NUTRITION || pathname.startsWith(`${ROUTES.NUTRITION}/`)) return 'nutrition';
  return null;
}

export function TabBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isTrainee = user?.role === 'trainee';
  const updates = useTabUpdates(isTrainee);
  const current = isTrainee ? openTab(pathname) : null;
  const hasUnseen = current !== null && updates[current];

  // Opening a tab clears its dot (stored on the server, so on every device).
  useEffect(() => {
    if (current && hasUnseen) void clearTabUpdate(current);
  }, [current, hasUnseen]);

  if (!user) return null;

  const tabs = tabsFor(user.role, updates);

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
          {tab.badge}
          <span className="tab-bar-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
