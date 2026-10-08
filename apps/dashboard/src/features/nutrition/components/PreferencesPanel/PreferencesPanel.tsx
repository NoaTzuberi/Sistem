import type { NutritionPreferences } from '@sistem/types';
import { describeNutritionPreferences } from '@sistem/shared';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './PreferencesPanel.css';

/** Her onboarding nutrition preferences, next to the plan (free text is shown as she wrote it). */
export function PreferencesPanel({ preferences }: { preferences: NutritionPreferences | null }) {
  return (
    <section className="preferences-panel" aria-labelledby="preferences-panel-title">
      <h2 className="nutrition-panel-title" id="preferences-panel-title">
        {NUTRITION_COPY.preferencesTitle}
      </h2>
      <dl className="preferences-panel-rows">
        {describeNutritionPreferences(preferences).map((row) => (
          <div key={row.label} className="preferences-panel-row">
            <dt>{row.label}</dt>
            <dd dir="auto">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
