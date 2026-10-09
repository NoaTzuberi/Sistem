import { useCallback } from 'react';
import type { AiNutritionInputSummary, AiNutritionRecommendation, Language } from '@sistem/types';
import { describeMealPortions, describePortionAmount, fill, formatKcal, humanizeId, labelList, PORTION_GROUPS, sharedCopy, useCopy, useLanguage, useLoad } from '@sistem/shared';
import { getAiRecommendation } from '../../../../services/coach/coachService';
import { Badge } from '../../../../components/common/Badge/Badge';
import { aiDraftCopy } from '../../copy';
import './NutritionAiRationale.css';

interface NutritionAiRationaleProps {
  traineeId: string;
  recommendationId: string;
  /** Already loaded (the latest draft) — saves a request. */
  recommendation?: AiNutritionRecommendation | null;
}

function inputRows(input: AiNutritionInputSummary, copy: (typeof aiDraftCopy)['he'], language: Language): { label: string; value: string }[] {
  const { profile, calculation } = input;
  const labels = copy.profile;
  const shared = sharedCopy[language];
  const weeks = profile.weightGoal?.weeks;
  return [
    { label: labels.age, value: profile.ageYears !== undefined ? String(profile.ageYears) : '—' },
    { label: labels.heightWeight, value: fill(labels.heightWeightValue, { height: profile.heightCm ?? '—', weight: profile.weightKg ?? '—' }) },
    {
      label: labels.gender,
      value: profile.gender ? ((shared.onboardingOptions.gender as Record<string, string>)[profile.gender] ?? humanizeId(profile.gender)) : '—',
    },
    { label: labels.goals, value: labelList(profile.goals, shared.onboardingOptions.goals, language) },
    {
      label: labels.targetWeight,
      value: profile.weightGoal
        ? fill(labels.targetWeightValue, { weight: profile.weightGoal.targetWeightKg }) +
          (weeks !== null && weeks !== undefined ? fill(labels.inWeeks, { weeks }) : '')
        : '—',
    },
    { label: labels.diet, value: profile.dietType ? shared.nutrition.dietTypes[profile.dietType] : '—' },
    {
      label: labels.dietStylesReligious,
      value: labelList([...profile.dietStyles, ...profile.religious], { ...shared.nutrition.dietStyles, ...shared.nutrition.religious }, language),
    },
    { label: labels.intolerances, value: labelList(profile.intolerances, shared.nutrition.intolerances, language) },
    { label: labels.allergies, value: labelList(profile.allergies, shared.nutrition.allergies, language) },
    { label: labels.mealsPerDay, value: profile.mealsPerDay !== null ? String(profile.mealsPerDay) : labels.noPreference },
    {
      label: labels.target,
      value: calculation
        ? `${formatKcal(calculation.kcal, language)} (${calculation.targetSource === 'plan' ? labels.targetYours : labels.targetCalculation})`
        : '—',
    },
    { label: labels.dailyPortions, value: calculation ? describeMealPortions(calculation.dailyPortions, false, language) : '—' },
  ];
}

/** Nutrition builder: why the AI drafted these meals, and what it was given. Coach-only. */
export function NutritionAiRationale({ traineeId, recommendationId, recommendation }: NutritionAiRationaleProps) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(aiDraftCopy);
  const known = recommendation?.id === recommendationId ? recommendation : null;
  const load = useCallback(
    () => (known ? Promise.resolve(known) : getAiRecommendation(traineeId, recommendationId)),
    [known, traineeId, recommendationId],
  );
  const { data: loaded, error } = useLoad(load, copy.training.loadError);
  const data = loaded?.type === 'nutrition_plan' ? loaded : null;
  const output = data?.output;

  return (
    <details className="nutrition-ai-rationale">
      <summary className="nutrition-ai-rationale-summary">
        <span className="nutrition-ai-rationale-title">{copy.nutrition.rationaleTitle}</span>
        <Badge tone="alert">{copy.training.reviewBadge}</Badge>
      </summary>

      {error && <p className="nutrition-ai-rationale-muted">{error}</p>}
      {loaded && !output && <p className="nutrition-ai-rationale-muted">{copy.training.loadError}</p>}

      {output && (
        <div className="nutrition-ai-rationale-body">
          {output.meals.map((meal, mealIndex) => (
            <div key={`${meal.name}-${mealIndex}`} className="nutrition-ai-rationale-meal">
              <p className="nutrition-ai-rationale-meal-title">
                <bdi>{meal.name}</bdi> · {describeMealPortions(meal.portions, meal.vegetablesFree, language)}
              </p>
              <p className="nutrition-ai-rationale-muted" dir="auto">
                {meal.why}
              </p>
              <ul className="nutrition-ai-rationale-list">
                {meal.options.map((option) => (
                  <li key={option.label}>
                    <span className="nutrition-ai-rationale-option" dir="auto">{option.label}:</span>{' '}
                    <span dir="auto">
                      {option.lines
                        .map((line) =>
                          line.food
                            ? `${line.food.name} — ${describePortionAmount(line.food.portion, line.portions, language)}${line.food.archived ? ` (${copy.nutrition.archivedFood})` : ''}`
                            : copy.nutrition.missingFood,
                        )
                        .join(' + ')}
                    </span>
                    {option.why && (
                      <span className="nutrition-ai-rationale-muted" dir="auto">
                        {' '}
                        — {option.why}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {data?.input && (
            <details className="nutrition-ai-rationale-input">
              <summary className="nutrition-ai-rationale-heading">{copy.nutrition.inputTitle}</summary>
              <p className="nutrition-ai-rationale-muted">{copy.nutrition.inputNoIdentity}</p>
              <dl className="nutrition-ai-rationale-facts">
                {inputRows(data.input, copy, language).map((row) => (
                  <div key={row.label} className="nutrition-ai-rationale-fact">
                    <dt>{row.label}</dt>
                    <dd dir="auto">{row.value}</dd>
                  </div>
                ))}
                <div className="nutrition-ai-rationale-fact">
                  <dt>{copy.nutrition.foodsSent}</dt>
                  <dd>
                    {PORTION_GROUPS.map((group) => `${shared.nutrition.groups[group]} ${data.input!.foods[group].sent} (${data.input!.foods[group].filteredOut})`).join(' · ')}
                  </dd>
                </div>
                <div className="nutrition-ai-rationale-fact">
                  <dt>{copy.nutrition.excludedTags}</dt>
                  <dd>{data.input.excludedTags.map((tag) => shared.nutrition.dietTags[tag]).join(', ') || '—'}</dd>
                </div>
              </dl>
              <p className="nutrition-ai-rationale-muted">
                {data.input.promptVersion}
                {data.model ? ` · ${data.model}` : ''}
              </p>
            </details>
          )}
        </div>
      )}
    </details>
  );
}
