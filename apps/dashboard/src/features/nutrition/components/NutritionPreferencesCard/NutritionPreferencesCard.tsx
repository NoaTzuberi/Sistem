import type { NutritionPreferences } from '@sistem/types';
import { nutritionPreferenceFields, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import type { NutritionPreferenceField } from '@sistem/shared';
import { TabCard } from '../../../trainees/components/TabCard/TabCard';
import { nutritionCopy } from '../../copy';
import './NutritionPreferencesCard.css';

// Diet = pink, sensitivities = amber, meals a day = blue; the rest neutral.
const TONE: Partial<Record<NutritionPreferenceField, string>> = {
  diet: 'nutrition-pref-pink',
  intolerances: 'nutrition-pref-amber',
  allergies: 'nutrition-pref-amber',
  mealsPerDay: 'nutrition-pref-blue',
};

/** Her questionnaire answers as tinted tiles; the unanswered ones fold into one quiet "Not specified: …" line. */
export function NutritionPreferencesCard({ preferences }: { preferences: NutritionPreferences | null }) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const fields = nutritionPreferenceFields(preferences, language);
  const answered = fields?.filter((field) => field.value !== null) ?? [];
  const missing = fields?.filter((field) => field.value === null) ?? [];

  return (
    <TabCard className="nutrition-prefs" title={copy.tab.preferencesTitle} subtitle={copy.tab.fromQuestionnaire}>
      {fields === null ? (
        <p className="nutrition-prefs-missing">{shared.common.notAnswered}</p>
      ) : (
        <>
          <dl className="nutrition-prefs-tiles">
            {answered.map((field) => (
              <div key={field.id} className={`nutrition-prefs-tile ${TONE[field.id] ?? ''}`}>
                <dt>{field.label}</dt>
                <dd dir="auto">{field.value}</dd>
              </div>
            ))}
          </dl>
          {missing.length > 0 && (
            <p className="nutrition-prefs-missing">
              {copy.tab.notSpecified} {missing.map((field) => field.label).join(' · ')}
            </p>
          )}
        </>
      )}
    </TabCard>
  );
}
