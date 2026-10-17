import type { CSSProperties } from 'react';
import { fill, useCopy, useI18n } from '@sistem/shared';
import { SETTING_BOUNDS, STEPS } from '../../data/settingsForm';
import type { SettingsErrors, SettingsForm } from '../../data/settingsForm';
import { SettingsCard } from '../SettingsCard/SettingsCard';
import { FieldMessage } from '../FieldMessage/FieldMessage';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsActivityMultipliers.css';

interface Props {
  form: SettingsForm;
  errors: SettingsErrors;
  update: (change: (current: SettingsForm) => SettingsForm) => void;
}

// The bars start at 1.0 (no multiplier) and reach the top at 2.0, or at the largest factor typed.
const BAR_FLOOR = 1;
const BAR_TOP = 2;

/** 3 · the activity factor by training days: seven columns, each a number above a bar of its relative size. */
export function SettingsActivityMultipliers({ form, errors, update }: Props) {
  const { plural } = useI18n();
  const copy = useCopy(nutritionLibraryCopy);
  const top = Math.max(BAR_TOP, ...form.activityFactors.filter((value): value is number => value !== undefined));
  const share = (value: number | undefined) => (value === undefined ? 0 : Math.min(1, Math.max(0, (value - BAR_FLOOR) / (top - BAR_FLOOR))));
  const messages = form.activityFactors
    .map((_, index) => ({ index, error: errors[`activityFactors.${index}`] }))
    .filter((entry) => entry.error !== undefined);

  return (
    <SettingsCard number={3} title={copy.cards.activity.title} text={copy.cards.activity.text}>
      <div className="activity-columns">
        {form.activityFactors.map((factor, index) => {
          const days = plural(copy.days, index + 1);
          const error = errors[`activityFactors.${index}`];
          return (
            <label key={index} className="activity-column">
              <input
                className={error ? 'activity-input activity-input-invalid' : 'activity-input'}
                type="number"
                inputMode="decimal"
                dir="ltr"
                step={STEPS.activityFactor}
                min={SETTING_BOUNDS.activityFactor.min}
                max={SETTING_BOUNDS.activityFactor.max}
                aria-label={fill(copy.activityFor, { days })}
                aria-invalid={error !== undefined}
                aria-describedby={error ? 'settings-activity-error' : undefined}
                value={factor ?? ''}
                onChange={(event) => {
                  const next = event.target.value === '' ? undefined : Number(event.target.value);
                  const value = next !== undefined && Number.isFinite(next) ? next : undefined;
                  update((current) => ({ ...current, activityFactors: current.activityFactors.map((old, i) => (i === index ? value : old)) }));
                }}
              />
              <span className="activity-bar" aria-hidden="true">
                <span className="activity-bar-fill" style={{ '--share': share(factor) } as CSSProperties} />
              </span>
              <span className="activity-days" aria-hidden="true">
                {days}
              </span>
            </label>
          );
        })}
      </div>
      {messages.length > 0 && <FieldMessage id="settings-activity-error" error={messages[0].error} />}
    </SettingsCard>
  );
}
