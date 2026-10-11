import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { Language } from '@sistem/types';
import { sharedCopy, useCopy, useI18n } from '@sistem/shared';
import { updatePreferences } from '../../../services/auth/authService';
import { LanguageSwitch } from '../../common/LanguageSwitch/LanguageSwitch';
import { appCopy } from '../../../copy';
import { useAuth } from '../../../services/auth/AuthContext';
import { ROUTES } from '../../../app/config/routes';
import { Logo } from '../../common/Logo/Logo';
import { Button } from '../../common/Button/Button';
import { NotificationBell } from '../../../features/notifications/components/NotificationBell/NotificationBell';
import './DashboardShell.css';

/** The frame around every signed-in page: top bar + the routed page. */
export function DashboardShell() {
  const { user, logout, updateUser } = useAuth();
  const copy = useCopy(appCopy);
  const shared = useCopy(sharedCopy);
  const { setLanguage } = useI18n();
  const [languageError, setLanguageError] = useState(false);

  // The screen has already switched; saving makes it her language on every device (and for server texts).
  function saveLanguage(next: Language, previous: Language) {
    setLanguageError(false);
    updatePreferences({ language: next })
      .then((updated) => updateUser({ language: updated.language }))
      .catch(() => {
        setLanguage(previous);
        setLanguageError(true);
      });
  }

  return (
    <div className="dashboard-shell">
      <header className="shell-bar">
        <div className="shell-brand">
          <Logo variant="mark" />
          <nav className="shell-nav" aria-label={copy.nav.main}>
            <NavLink className="shell-link" to={ROUTES.TRAINEES}>
              {copy.nav.trainees}
            </NavLink>
            <NavLink className="shell-link" to={ROUTES.NUTRITION}>
              {copy.nav.nutrition}
            </NavLink>
            <NavLink className="shell-link" to={ROUTES.EXERCISES}>
              {copy.nav.exercises}
            </NavLink>
          </nav>
        </div>
        <div className="shell-actions">
          <LanguageSwitch onChange={(next) => saveLanguage(next, next === 'he' ? 'en' : 'he')} />
          {languageError && (
            <span className="shell-error" role="alert">
              {copy.languageSaveError}
            </span>
          )}
          <NotificationBell />
          <span className="shell-user" dir="auto">
            {user?.name}
          </span>
          <Button size="sm" onClick={logout}>
            {shared.common.logout}
          </Button>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
