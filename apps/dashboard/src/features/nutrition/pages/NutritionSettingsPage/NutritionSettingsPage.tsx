import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { NutritionConfig, NutritionGoal, NutritionSettingsPayload } from '@sistem/types';
import { FOOD_GROUP_LABELS, NUTRITION_GOAL_LABELS, PORTION_GROUPS, useLoad } from '@sistem/shared';
import { getNutritionSettings, saveNutritionSettings } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { NumberField } from '../../../../components/common/NumberField/NumberField';
import { NutritionSubnav } from '../../components/NutritionSubnav/NutritionSubnav';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './NutritionSettingsPage.css';

const GOALS: NutritionGoal[] = ['fat_loss', 'recomp', 'muscle_gain', 'maintenance'];

/** The form's numbers; an emptied field is undefined until she types again. */
type Form = {
  groupKcal: Record<'protein' | 'carb' | 'fat', number | undefined>;
  goalAdjustments: Record<NutritionGoal, number | undefined>;
  activityFactors: (number | undefined)[];
  floorKcal: number | undefined;
};

function toForm(config: NutritionConfig): Form {
  return {
    groupKcal: { protein: config.groupKcal.protein, carb: config.groupKcal.carb, fat: config.groupKcal.fat },
    goalAdjustments: { ...config.goalAdjustments },
    activityFactors: [...config.activityFactors],
    floorKcal: config.floorKcal,
  };
}

/** Undefined while a field is empty — the server checks the ranges. */
function toPayload(form: Form): NutritionSettingsPayload | undefined {
  const values = [...Object.values(form.groupKcal), ...Object.values(form.goalAdjustments), ...form.activityFactors, form.floorKcal];
  if (values.some((value) => value === undefined)) return undefined;
  return form as NutritionSettingsPayload;
}

/** THE coach-tunable nutrition config (PRD §5.6): group values, goal %, activity factors, floor. */
export function NutritionSettingsPage() {
  const { data, error, isLoading, reload } = useLoad(getNutritionSettings, "Couldn't load the settings.");
  const [form, setForm] = useState<Form>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm(toForm(data.config));
  }, [data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = form && toPayload(form);
    if (!payload) return;
    setBusy(true);
    setMessage(undefined);
    try {
      setForm(toForm((await saveNutritionSettings(payload)).config));
      setMessage(NUTRITION_COPY.saved);
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : "Couldn't save the settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nutrition-settings-page">
      <NutritionSubnav />
      <h1 className="nutrition-settings-title">{NUTRITION_COPY.settingsTitle}</h1>
      <p className="nutrition-settings-note">{NUTRITION_COPY.settingsIntro}</p>

      {isLoading && !data && <p>Loading…</p>}
      {error && !data && (
        <p role="alert">
          {error} <Button size="sm" onClick={reload}>Try again</Button>
        </p>
      )}

      {form && data && (
        <form className="nutrition-settings-form" onSubmit={submit}>
          <fieldset className="nutrition-settings-group">
            <legend>{NUTRITION_COPY.groupValues}</legend>
            {PORTION_GROUPS.map((group) => (
              <NumberField
                key={group}
                label={FOOD_GROUP_LABELS[group]}
                value={form.groupKcal[group]}
                onChange={(value) => setForm({ ...form, groupKcal: { ...form.groupKcal, [group]: value } })}
              />
            ))}
          </fieldset>

          <fieldset className="nutrition-settings-group">
            <legend>{NUTRITION_COPY.goalAdjustments}</legend>
            {GOALS.map((goal) => (
              <NumberField
                key={goal}
                label={NUTRITION_GOAL_LABELS[goal]}
                value={form.goalAdjustments[goal]}
                min={-40}
                onChange={(value) => setForm({ ...form, goalAdjustments: { ...form.goalAdjustments, [goal]: value } })}
              />
            ))}
          </fieldset>

          <fieldset className="nutrition-settings-group">
            <legend>{NUTRITION_COPY.activityFactors}</legend>
            {form.activityFactors.map((factor, index) => (
              <NumberField
                key={index}
                label={NUTRITION_COPY.days(index + 1)}
                value={factor}
                step={0.025}
                min={1}
                onChange={(value) =>
                  setForm({ ...form, activityFactors: form.activityFactors.map((current, i) => (i === index ? value : current)) })
                }
              />
            ))}
          </fieldset>

          <fieldset className="nutrition-settings-group">
            <legend>{NUTRITION_COPY.floor}</legend>
            <NumberField label={NUTRITION_COPY.floor} hideLabel value={form.floorKcal} step={10} onChange={(value) => setForm({ ...form, floorKcal: value })} />
          </fieldset>

          <div className="nutrition-settings-actions">
            <Button type="submit" variant="primary" disabled={busy || !toPayload(form)}>
              {NUTRITION_COPY.save}
            </Button>
            <Button onClick={() => setForm(toForm(data.defaults))}>{NUTRITION_COPY.resetDefaults}</Button>
            {message && (
              <span className="nutrition-settings-note" role="status">
                {message}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
