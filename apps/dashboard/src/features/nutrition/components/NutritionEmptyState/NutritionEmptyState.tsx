import type { NutritionPreferences } from '@sistem/types';
import { fill, formatPlural, nutritionPreferenceFields, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { nutritionCopy } from '../../copy';
import './NutritionEmptyState.css';

interface NutritionEmptyStateProps {
  preferences: NutritionPreferences | null;
  /** Where both actions go: the nutrition builder. */
  builderPath: string;
  /** An AI nutrition draft is ready for her (13c) — only then the second action shows. */
  hasAiDraft: boolean;
}

/** No nutrition plan yet: a soft illustration, one sentence from her real preferences, and the way into the builder. */
export function NutritionEmptyState({ preferences, builderPath, hasAiDraft }: NutritionEmptyStateProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy).tab;
  const sentence = preferenceSentence(preferences, language, copy, shared);

  return (
    <section className="nutrition-empty" aria-labelledby="nutrition-empty-title">
      <span className="nutrition-empty-art" aria-hidden="true">
        <i className="nutrition-empty-blob nutrition-empty-blob-main" />
        <i className="nutrition-empty-blob nutrition-empty-blob-peach" />
        <i className="nutrition-empty-blob nutrition-empty-blob-lilac" />
        <Icon name="utensils" className="nutrition-empty-icon" />
      </span>
      <h2 className="nutrition-empty-title" id="nutrition-empty-title">
        {copy.emptyTitle}
      </h2>
      {sentence && <p className="nutrition-empty-text">{sentence}</p>}
      <div className="nutrition-empty-actions">
        <PillButton variant="primary" to={builderPath}>
          <Icon name="plus" size="sm" />
          {copy.buildPlan}
        </PillButton>
        {hasAiDraft && (
          <PillButton to={builderPath}>
            <Icon name="spark" size="sm" />
            {copy.aiDraft}
          </PillButton>
        )}
      </div>
    </section>
  );
}

/** 'We'll build her a plan from her questionnaire: vegetarian, lactose-free, 3 meals a day.' — null without answers. */
function preferenceSentence(
  preferences: NutritionPreferences | null,
  language: ReturnType<typeof useLanguage>,
  copy: (typeof nutritionCopy)['he']['tab'],
  shared: (typeof sharedCopy)['he'],
): string | null {
  const fields = nutritionPreferenceFields(preferences, language);
  if (!preferences || !fields) return null;
  const valueOf = (id: string) => fields.find((field) => field.id === id)?.value ?? null;
  const parts = [
    preferences.dietType !== 'none' ? valueOf('diet') : null,
    preferences.intolerances.length > 0 ? valueOf('intolerances') : null,
    preferences.allergies.length > 0 ? valueOf('allergies') : null,
    preferences.mealsPerDay ? fill(copy.mealsADay, { meals: formatPlural(language, shared.nutrition.meals, preferences.mealsPerDay) }) : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? fill(copy.emptyFromPreferences, { list: parts.join(shared.common.listSeparator) }) : null;
}
