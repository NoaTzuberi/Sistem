import { describeNutritionPreferences, describeWeightGoal, toKg, useCopy, useLanguage } from '@sistem/shared';
import { onboardingCopy } from '../../copy';
import { asksWeightGoal, toPreferencesPayload, toWeightGoalPayload } from '../../data/nutritionForm';
import type { OnboardingFormState } from '../../types';
import './ReviewStep.css';

interface ReviewStepProps {
  formState: OnboardingFormState;
}

export function ReviewStep({ formState }: ReviewStepProps) {
  const copy = useCopy(onboardingCopy);
  const language = useLanguage();
  // Phase 13a: the "Nutrition & goal" answers, so she can check them before finishing.
  const unit = formState.units.weight;
  const goal = asksWeightGoal(formState.goals) ? toWeightGoalPayload(formState.weightGoal) : null;
  const nutritionRows = [
    ...(goal
      ? [{ label: copy.nutrition.goalTitle, value: describeWeightGoal({ targetWeightKg: toKg(goal.targetWeight, unit), timeframe: goal.timeframe }, unit, language) }]
      : []),
    ...describeNutritionPreferences(toPreferencesPayload(formState.nutritionPreferences), language),
  ];

  return (
    <>
      <p className="text-body">{copy.review.body}</p>

      <section className="review-step-section" aria-label={copy.nutrition.reviewTitle}>
        <h2 className="text-label">{copy.nutrition.reviewTitle}</h2>
        <dl className="review-step-rows">
          {nutritionRows.map((row) => (
            <div key={row.label} className="review-step-row">
              <dt>{row.label}</dt>
              <dd dir="auto">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
