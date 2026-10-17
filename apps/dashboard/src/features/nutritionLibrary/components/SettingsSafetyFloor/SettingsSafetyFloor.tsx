import { useCopy } from '@sistem/shared';
import { SETTING_BOUNDS, STEPS } from '../../data/settingsForm';
import type { SettingsErrors, SettingsForm } from '../../data/settingsForm';
import { SettingsCard } from '../SettingsCard/SettingsCard';
import { SettingsStepper } from '../SettingsStepper/SettingsStepper';
import { FieldMessage } from '../FieldMessage/FieldMessage';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsSafetyFloor.css';

interface Props {
  form: SettingsForm;
  errors: SettingsErrors;
  update: (change: (current: SettingsForm) => SettingsForm) => void;
}

/** 4 · the safety floor: one large ±50 stepper. A lower target still needs the coach's explicit confirmation in the builder. */
export function SettingsSafetyFloor({ form, errors, update }: Props) {
  const copy = useCopy(nutritionLibraryCopy);
  const error = errors.floorKcal;
  return (
    <SettingsCard number={4} title={copy.cards.floor.title} text={copy.cards.floor.text}>
      <div className="safety-floor">
        <SettingsStepper
          label={copy.floorLabel}
          value={form.floorKcal}
          step={STEPS.floorKcal}
          bounds={SETTING_BOUNDS.floorKcal}
          size="lg"
          invalid={error !== undefined}
          describedBy={error ? 'settings-floor-error' : undefined}
          onChange={(value) => update((current) => ({ ...current, floorKcal: value }))}
        />
        <span className="safety-floor-unit">{copy.floorUnit}</span>
      </div>
      <FieldMessage id="settings-floor-error" error={error} />
    </SettingsCard>
  );
}
