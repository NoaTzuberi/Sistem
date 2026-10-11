import type { Language } from '@sistem/types';
import { useCopy, useI18n } from '@sistem/shared';
import { PlaceholderPage } from '../../../../components/layout/PlaceholderPage/PlaceholderPage';
import { LogoutButton } from '../../../../components/common/LogoutButton/LogoutButton';
import { LanguageSwitch } from '../../../../components/common/LanguageSwitch/LanguageSwitch';
import { DashboardLinkRow } from '../../components/DashboardLinkRow/DashboardLinkRow';
import { useAuth } from '../../../../services/auth/AuthContext';
import { updatePreferences } from '../../../../services/users/usersService';
import { appCopy } from '../../../../copy';

// The coach's Profile is a placeholder (her settings live on the dashboard); the language can
// be switched here too, saved on the server like the trainee's Settings (Phase 15).
export function CoachProfilePage() {
  const copy = useCopy(appCopy);
  const { setLanguage } = useI18n();
  const { updateUser } = useAuth();

  function saveLanguage(next: Language, previous: Language) {
    updatePreferences({ language: next })
      .then((updated) => updateUser({ language: updated.language }))
      .catch(() => setLanguage(previous));
  }

  return (
    <PlaceholderPage title={copy.tabs.profile}>
      <DashboardLinkRow />
      <LanguageSwitch onChange={(next) => saveLanguage(next, next === 'he' ? 'en' : 'he')} />
      <LogoutButton />
    </PlaceholderPage>
  );
}
