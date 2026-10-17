import { useState } from 'react';
import { PORTION_GROUPS, fill, formatNumber, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog/ConfirmDialog';
import { Icon } from '../../../../components/common/Icon/Icon';
import { SAFETY_FIELDS, SETTING_BOUNDS, STEPS } from '../../data/settingsForm';
import type { SettingsErrors, SettingsForm } from '../../data/settingsForm';
import { usePortionSplit } from '../../hooks/usePortionSplit';
import { SettingsCard } from '../SettingsCard/SettingsCard';
import { SettingsTile } from '../SettingsTile/SettingsTile';
import { PortionSplitBar } from '../PortionSplitBar/PortionSplitBar';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsMore.css';

interface Props {
  form: SettingsForm;
  errors: SettingsErrors;
  update: (change: (current: SettingsForm) => SettingsForm) => void;
  /** Puts every setting back to the defaults (unsaved until she saves). */
  onResetDefaults: () => void;
}

/**
 * 5 · the calculation's other numbers (13a+): the pace / safety caps, the portion split (a live bar that
 * must reach exactly 100) and the keto limit; its footer resets the settings to the defaults, after asking.
 */
export function SettingsMore({ form, errors, update, onResetDefaults }: Props) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy);
  const language = useLanguage();
  const split = usePortionSplit(form);
  const [isAskingReset, setIsAskingReset] = useState(false);

  return (
    <SettingsCard number={5} title={copy.cards.more.title} text={copy.cards.more.text}>
      <section className="settings-more-block" aria-labelledby="settings-more-safety">
        <h3 className="settings-more-sub" id="settings-more-safety">
          {copy.safetyTitle}
        </h3>
        <div className="settings-more-grid">
          {SAFETY_FIELDS.map(({ key, step, bounds, tone }) => (
            <SettingsTile
              key={key}
              tone={tone}
              name={copy.safetyTiles[key].name}
              unit={copy.safetyTiles[key].unit}
              label={copy.safetyLabels[key]}
              value={form[key]}
              step={step}
              bounds={bounds}
              error={errors[key]}
              errorId={`settings-${key}-error`}
              onChange={(value) => update((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </div>
      </section>

      <section className="settings-more-block" aria-labelledby="settings-more-split">
        <div className="settings-more-sub-row">
          <h3 className="settings-more-sub" id="settings-more-split">
            {copy.splitTitle}
            <small className="settings-more-sub-unit">{copy.splitUnit}</small>
          </h3>
          <span className={split.isComplete ? 'settings-more-sum settings-more-sum-ok' : 'settings-more-sum settings-more-sum-off'} dir="ltr">
            {split.isComplete ? (
              <>
                <Icon name="check" size="sm" />
                {copy.sumOk}
              </>
            ) : (
              fill(copy.sumOf, { sum: formatNumber(split.total, language) })
            )}
          </span>
        </div>
        <PortionSplitBar segments={split.segments} total={split.total} />
        {/* Polite: it changes with every step while she types. */}
        <p className={split.message ? 'settings-more-alert' : 'settings-more-hint'} role="status">
          <Icon name={split.message ? 'alert' : 'info'} size="sm" />
          {split.message ?? copy.splitHint}
        </p>
        <div className="settings-more-grid">
          {PORTION_GROUPS.map((group) => (
            <SettingsTile
              key={group}
              tone={group}
              dot
              name={shared.nutrition.groups[group]}
              unit={copy.percent}
              label={fill(copy.splitPct, { group: shared.nutrition.groups[group] })}
              value={form.portionSplit[group]}
              step={STEPS.portionSplitPct}
              bounds={SETTING_BOUNDS.portionSplitPct}
              error={errors[`portionSplit.${group}`]}
              errorId={`settings-split-${group}-error`}
              onChange={(value) => update((current) => ({ ...current, portionSplit: { ...current.portionSplit, [group]: value } }))}
            />
          ))}
        </div>
      </section>

      <section className="settings-more-block" aria-labelledby="settings-more-keto">
        <h3 className="settings-more-sub" id="settings-more-keto">
          {copy.ketoTitle}
        </h3>
        <div className="settings-more-keto">
          <SettingsTile
            tone="neutral"
            name={copy.ketoTile.name}
            unit={copy.ketoTile.unit}
            label={copy.ketoMaxCarb}
            value={form.ketoMaxCarbPortions}
            step={STEPS.ketoMaxCarbPortions}
            bounds={SETTING_BOUNDS.ketoMaxCarbPortions}
            error={errors.ketoMaxCarbPortions}
            errorId="settings-keto-error"
            onChange={(value) => update((current) => ({ ...current, ketoMaxCarbPortions: value }))}
          />
          <p className="settings-more-keto-text">{copy.ketoText}</p>
        </div>
      </section>

      <footer className="settings-more-foot">
        <button
          className="settings-more-reset"
          type="button"
          onClick={(event) => {
            // Safari doesn't focus a clicked button; the dialog hands the focus back to it.
            event.currentTarget.focus();
            setIsAskingReset(true);
          }}
        >
          <Icon name="refresh" size="sm" />
          {copy.resetDefaults}
        </button>
      </footer>

      <ConfirmDialog
        isOpen={isAskingReset}
        title={copy.resetTitle}
        text={copy.resetText}
        confirmLabel={copy.resetDefaults}
        cancelLabel={copy.cancel}
        onCancel={() => setIsAskingReset(false)}
        onConfirm={() => {
          setIsAskingReset(false);
          onResetDefaults();
        }}
      />
    </SettingsCard>
  );
}
