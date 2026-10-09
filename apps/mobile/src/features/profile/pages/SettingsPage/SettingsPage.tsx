import { useState } from 'react';
import type { Language, UnitPreferences } from '@sistem/types';
import { unitLabel, useCopy, useI18n } from '@sistem/shared';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { LogoutButton } from '../../../../components/common/LogoutButton/LogoutButton';
import { LanguageSwitch } from '../../../../components/common/LanguageSwitch/LanguageSwitch';
import { ROUTES } from '../../../../app/config/routes';
import { useAuth } from '../../../../services/auth/AuthContext';
import { updatePreferences } from '../../../../services/users/usersService';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { UnitToggle } from '../../components/UnitToggle/UnitToggle';
import { profileCopy } from '../../copy';
import { useMyUnits } from '../../hooks/useMyBody';
import './SettingsPage.css';

const WEIGHT_UNITS = ['kg', 'lb'] as const;
const LENGTH_UNITS = ['cm', 'in'] as const;

// Settings (PRD §5.5): units for body tracking, the language (Phase 15), her time zone, log out.
// Notification settings come with push (Phase 5b — owner decision).
export function SettingsPage() {
  const copy = useCopy(profileCopy);
  const { language, setLanguage } = useI18n();
  const { user, updateUser } = useAuth();
  const { units } = useMyUnits();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<'units' | 'language' | null>(null);

  async function changeUnits(patch: Partial<UnitPreferences>) {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updatePreferences({ units: patch });
      updateUser({ units: updated.units });
    } catch {
      setError('units');
    } finally {
      setIsSaving(false);
    }
  }

  // The screen has already switched (LanguageSwitch); saving makes it her language on every device.
  async function saveLanguage(next: Language, previous: Language) {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updatePreferences({ language: next });
      updateUser({ language: updated.language });
    } catch {
      setLanguage(previous);
      setError('language');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="settings-page">
        <SubPageHeader title={copy.settingsTitle} fallbackPath={ROUTES.PROFILE} />

        <section className="settings-page-section">
          <h2 className="settings-page-heading">{copy.unitsTitle}</h2>
          <UnitToggle
            label={copy.weightUnit}
            options={WEIGHT_UNITS}
            optionLabel={(unit) => unitLabel(unit, language)}
            value={units.weight}
            disabled={isSaving}
            onChange={(weight) => void changeUnits({ weight })}
          />
          <UnitToggle
            label={copy.lengthUnit}
            options={LENGTH_UNITS}
            optionLabel={(unit) => unitLabel(unit, language)}
            value={units.length}
            disabled={isSaving}
            onChange={(length) => void changeUnits({ length })}
          />
          <p className="settings-page-hint">{copy.unitsHint}</p>
          {error === 'units' && (
            <p className="settings-page-error" role="alert">
              {copy.unitsSaveError}
            </p>
          )}
        </section>

        <section className="settings-page-section">
          <h2 className="settings-page-heading">{copy.languageTitle}</h2>
          <LanguageSwitch disabled={isSaving} onChange={(next) => void saveLanguage(next, language)} />
          <p className="settings-page-hint">{copy.languageHint}</p>
          {error === 'language' && (
            <p className="settings-page-error" role="alert">
              {copy.languageSaveError}
            </p>
          )}
        </section>

        <section className="settings-page-section">
          <h2 className="settings-page-heading">{copy.account}</h2>
          <div className="settings-page-row">
            <span>{copy.timezone}</span>
            <span className="settings-page-value">{user?.timezone}</span>
          </div>
          <LogoutButton />
        </section>
      </div>
    </AppShell>
  );
}
