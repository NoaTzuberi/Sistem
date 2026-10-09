import type { NutritionPreferences } from '@sistem/types';
import { describeNutritionPreferences, useCopy, useLanguage } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import './PreferencesPanel.css';

/** Her onboarding nutrition preferences, next to the plan (free text is shown as she wrote it). */
export function PreferencesPanel({ preferences }: { preferences: NutritionPreferences | null }) {
  const language = useLanguage();
  const copy = useCopy(nutritionCopy);
  return (
    <section className="preferences-panel" aria-labelledby="preferences-panel-title">
      <h2 className="nutrition-panel-title" id="preferences-panel-title">
        {copy.preferencesTitle}
      </h2>
      <dl className="preferences-panel-rows">
        {describeNutritionPreferences(preferences, language).map((row) => (
          <div key={row.label} className="preferences-panel-row">
            <dt>{row.label}</dt>
            <dd dir="auto">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
