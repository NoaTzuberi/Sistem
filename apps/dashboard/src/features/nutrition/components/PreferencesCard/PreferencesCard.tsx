import type { NutritionPreferences } from '@sistem/types';
import { describeNutritionPreferences, useCopy, useLanguage } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import './PreferencesCard.css';

/** Her questionnaire's nutrition answers next to the plan (free text as she wrote it); a quiet line when she skipped them. */
export function PreferencesCard({ preferences }: { preferences: NutritionPreferences | null }) {
  const language = useLanguage();
  const copy = useCopy(nutritionCopy);
  return (
    <section className="nb-quiet-card" aria-labelledby="nb-preferences-title">
      <h3 className="nb-side-title" id="nb-preferences-title">
        {copy.preferencesTitle}
      </h3>
      {preferences ? (
        <dl className="nb-preferences">
          {describeNutritionPreferences(preferences, language).map((row) => (
            <div key={row.label} className="nb-preferences-row">
              <dt>{row.label}</dt>
              <dd dir="auto">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="nb-preferences-none">
          <span className="nb-preferences-ring" aria-hidden="true" />
          {copy.builder.noPreferences}
        </p>
      )}
    </section>
  );
}
