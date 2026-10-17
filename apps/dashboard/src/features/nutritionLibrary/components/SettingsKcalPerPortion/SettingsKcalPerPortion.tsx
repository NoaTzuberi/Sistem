import { PORTION_GROUPS, fill, sharedCopy, useCopy } from '@sistem/shared';
import { SETTING_BOUNDS, STEPS } from '../../data/settingsForm';
import type { SettingsErrors, SettingsForm } from '../../data/settingsForm';
import { SettingsCard } from '../SettingsCard/SettingsCard';
import { SettingsTile } from '../SettingsTile/SettingsTile';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsKcalPerPortion.css';

interface Props {
  form: SettingsForm;
  errors: SettingsErrors;
  update: (change: (current: SettingsForm) => SettingsForm) => void;
}

/** 1 · kcal per portion: a tile per counted group (its color) with a ±10 stepper. Vegetables stay free. */
export function SettingsKcalPerPortion({ form, errors, update }: Props) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy);
  return (
    <SettingsCard number={1} title={copy.cards.kcal.title} text={copy.cards.kcal.text}>
      <div className="settings-kcal-grid">
        {PORTION_GROUPS.map((group) => (
          <SettingsTile
            key={group}
            tone={group}
            name={shared.nutrition.groups[group]}
            unit={copy.perPortion}
            label={fill(copy.kcalFor, { group: shared.nutrition.portionWords[group] })}
            value={form.groupKcal[group]}
            step={STEPS.groupKcal}
            bounds={SETTING_BOUNDS.groupKcal}
            error={errors[`groupKcal.${group}`]}
            errorId={`settings-kcal-${group}-error`}
            onChange={(value) => update((current) => ({ ...current, groupKcal: { ...current.groupKcal, [group]: value } }))}
          />
        ))}
      </div>
    </SettingsCard>
  );
}
