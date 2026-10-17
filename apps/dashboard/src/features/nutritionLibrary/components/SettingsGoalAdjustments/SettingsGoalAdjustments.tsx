import type { CSSProperties } from 'react';
import { sharedCopy, fill, useCopy } from '@sistem/shared';
import { GOALS, SETTING_BOUNDS, STEPS } from '../../data/settingsForm';
import type { SettingsErrors, SettingsForm } from '../../data/settingsForm';
import { SettingsCard } from '../SettingsCard/SettingsCard';
import { SettingsStepper } from '../SettingsStepper/SettingsStepper';
import { FieldMessage } from '../FieldMessage/FieldMessage';
import { nutritionLibraryCopy } from '../../copy';
import './SettingsGoalAdjustments.css';

interface Props {
  form: SettingsForm;
  errors: SettingsErrors;
  update: (change: (current: SettingsForm) => SettingsForm) => void;
}

/** The scale's ends: the design's −30…+15, widened to fit any value she types. */
const SCALE_MIN = -30;
const SCALE_MAX = 15;

function tone(value: number | undefined): 'deficit' | 'surplus' | 'zero' {
  if (value === undefined || value === 0) return 'zero';
  return value < 0 ? 'deficit' : 'surplus';
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`;
}

/** 2 · the goal %: every goal on one scale (blue = deficit, pink = surplus), then a row per goal with a ±1 stepper. */
export function SettingsGoalAdjustments({ form, errors, update }: Props) {
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy);
  const values = GOALS.map((goal) => form.goalAdjustments[goal]).filter((value): value is number => value !== undefined);
  const min = Math.min(SCALE_MIN, ...values);
  const max = Math.max(SCALE_MAX, ...values);
  const position = (value: number) => ((value - min) / (max - min)) * 100;

  return (
    <SettingsCard number={2} title={copy.cards.goals.title} text={copy.cards.goals.text}>
      {/* The scale runs left → right (minus → plus) in both languages, like a chart axis. */}
      <div className="settings-goal-scale" role="img" aria-label={copy.goalScaleLabel} dir="ltr" style={{ '--zero': `${position(0)}%` } as CSSProperties}>
        <span className="settings-goal-scale-track">
          <span className="settings-goal-scale-deficit" />
          <span className="settings-goal-scale-surplus" />
        </span>
        <span className="settings-goal-scale-zero">0</span>
        {GOALS.map((goal, index) => {
          const value = form.goalAdjustments[goal];
          if (value === undefined) return null;
          return (
            <span
              key={goal}
              className={`settings-goal-scale-marker settings-goal-scale-marker-${tone(value)} settings-goal-scale-row-${index % 2}`}
              style={{ '--at': `${position(value)}%` } as CSSProperties}
            >
              {signed(value)}
            </span>
          );
        })}
      </div>

      <div className="settings-goal-rows">
        {GOALS.map((goal) => {
          const error = errors[`goalAdjustments.${goal}`];
          const messageId = `settings-goal-${goal}-error`;
          return (
            <div key={goal} className={`settings-goal-row settings-goal-row-${tone(form.goalAdjustments[goal])}`}>
              <span className="settings-goal-row-main">
                <span className="settings-goal-row-name">{shared.nutrition.goals[goal]}</span>
                <SettingsStepper
                  label={fill(copy.goalFor, { goal: shared.nutrition.goals[goal] })}
                  value={form.goalAdjustments[goal]}
                  step={STEPS.goalPct}
                  bounds={SETTING_BOUNDS.goalAdjustmentPct}
                  size="sm"
                  invalid={error !== undefined}
                  describedBy={error ? messageId : undefined}
                  onChange={(value) => update((current) => ({ ...current, goalAdjustments: { ...current.goalAdjustments, [goal]: value } }))}
                />
                <span className="settings-goal-row-unit">%</span>
              </span>
              <FieldMessage id={messageId} error={error} />
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}
