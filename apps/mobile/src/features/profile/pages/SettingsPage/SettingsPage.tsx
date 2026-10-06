import { useState } from 'react';
import type { UnitPreferences } from '@sistem/types';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { LogoutButton } from '../../../../components/common/LogoutButton/LogoutButton';
import { ROUTES } from '../../../../app/config/routes';
import { useAuth } from '../../../../services/auth/AuthContext';
import { updatePreferences } from '../../../../services/users/usersService';
import { SubPageHeader } from '../../components/SubPageHeader/SubPageHeader';
import { UnitToggle } from '../../components/UnitToggle/UnitToggle';
import { PROFILE_COPY } from '../../data/profileCopy';
import { useMyUnits } from '../../hooks/useMyBody';
import './SettingsPage.css';

const WEIGHT_UNITS = ['kg', 'lb'] as const;
const LENGTH_UNITS = ['cm', 'in'] as const;

// Settings (PRD §5.5): units for body tracking, her time zone, log out. Notification
// settings come with push (Phase 5b — owner decision).
export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { units } = useMyUnits();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeUnits(patch: Partial<UnitPreferences>) {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updatePreferences({ units: patch });
      updateUser({ units: updated.units });
    } catch {
      setError(PROFILE_COPY.unitsSaveError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="settings-page">
        <SubPageHeader title={PROFILE_COPY.settingsTitle} fallbackPath={ROUTES.PROFILE} />

        <section className="settings-page-section">
          <h2 className="settings-page-heading">{PROFILE_COPY.unitsTitle}</h2>
          <UnitToggle
            label={PROFILE_COPY.weightUnit}
            options={WEIGHT_UNITS}
            value={units.weight}
            disabled={isSaving}
            onChange={(weight) => void changeUnits({ weight })}
          />
          <UnitToggle
            label={PROFILE_COPY.lengthUnit}
            options={LENGTH_UNITS}
            value={units.length}
            disabled={isSaving}
            onChange={(length) => void changeUnits({ length })}
          />
          <p className="settings-page-hint">{PROFILE_COPY.unitsHint}</p>
          {error && (
            <p className="settings-page-error" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="settings-page-section">
          <h2 className="settings-page-heading">{PROFILE_COPY.account}</h2>
          <div className="settings-page-row">
            <span>{PROFILE_COPY.timezone}</span>
            <span className="settings-page-value">{user?.timezone}</span>
          </div>
          <LogoutButton />
        </section>
      </div>
    </AppShell>
  );
}
