import { describeNutritionPreferences } from '@sistem/shared';
import { NUTRITION_PREFERENCES_COPY } from '../../data/nutritionPreferencesCopy';
import type { OnboardingFormState } from '../../types';
import './ReviewStep.css';

interface ReviewStepProps {
  formState: OnboardingFormState;
}

export function ReviewStep({ formState }: ReviewStepProps) {
  const { nutritionPreferences } = formState;
  // Phase 13a: the new step's answers, so she can check them before finishing.
  const nutritionRows = describeNutritionPreferences({
    dietType: nutritionPreferences.dietType,
    kosher: nutritionPreferences.kosher,
    allergies: nutritionPreferences.allergies,
    allergyNotes: nutritionPreferences.allergyNotes.trim() || undefined,
    dislikes: nutritionPreferences.dislikes.trim() || undefined,
  });

  return (
    <div className="onboarding-step review-step">
      <h1>Your Sistem profile is ready.</h1>
      <p className="text-body">
        Sistem will use your goals, schedule, activities, preferences, and equipment to build a more
        relevant training experience.
      </p>

      <section className="review-step-section" aria-label={NUTRITION_PREFERENCES_COPY.reviewTitle}>
        <h2 className="text-label">{NUTRITION_PREFERENCES_COPY.reviewTitle}</h2>
        <dl className="review-step-rows">
          {nutritionRows.map((row) => (
            <div key={row.label} className="review-step-row">
              <dt>{row.label}</dt>
              <dd dir="auto">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
