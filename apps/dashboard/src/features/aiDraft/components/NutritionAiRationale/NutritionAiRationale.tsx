import { useCallback } from 'react';
import type { AiNutritionInputSummary, AiNutritionRecommendation } from '@sistem/types';
import {
  ALLERGY_LABELS,
  DIET_TAG_LABELS,
  DIET_TYPE_LABELS,
  FOOD_GROUP_LABELS,
  PORTION_GROUPS,
  describeMealPortions,
  describePortionAmount,
  formatKcal,
  humanizeId,
  humanizeList,
  useLoad,
} from '@sistem/shared';
import { getAiRecommendation } from '../../../../services/coach/coachService';
import { Badge } from '../../../../components/common/Badge/Badge';
import { AI_DRAFT_COPY, NUTRITION_AI_COPY } from '../../data/aiDraftCopy';
import './NutritionAiRationale.css';

interface NutritionAiRationaleProps {
  traineeId: string;
  recommendationId: string;
  /** Already loaded (the latest draft) — saves a request. */
  recommendation?: AiNutritionRecommendation | null;
}

function inputRows(input: AiNutritionInputSummary): { label: string; value: string }[] {
  const { profile, calculation } = input;
  const weeks = profile.weightGoal?.weeks;
  return [
    { label: 'Age', value: profile.ageYears !== undefined ? String(profile.ageYears) : '—' },
    { label: 'Height / weight', value: `${profile.heightCm ?? '—'} cm / ${profile.weightKg ?? '—'} kg` },
    { label: 'Gender', value: profile.gender ? humanizeId(profile.gender) : '—' },
    { label: 'Goals', value: humanizeList(profile.goals) },
    {
      label: 'Target weight',
      value: profile.weightGoal ? `${profile.weightGoal.targetWeightKg} kg${weeks !== null && weeks !== undefined ? ` in ${weeks} weeks` : ''}` : '—',
    },
    { label: 'Diet', value: profile.dietType ? DIET_TYPE_LABELS[profile.dietType] : '—' },
    { label: 'Diet styles / religious', value: humanizeList([...profile.dietStyles, ...profile.religious]) },
    { label: 'Intolerances', value: humanizeList(profile.intolerances) },
    { label: 'Allergies', value: profile.allergies.map((id) => ALLERGY_LABELS[id as keyof typeof ALLERGY_LABELS] ?? humanizeId(id)).join(', ') || '—' },
    { label: 'Meals per day', value: profile.mealsPerDay !== null ? String(profile.mealsPerDay) : 'No preference' },
    { label: 'Target', value: calculation ? `${formatKcal(calculation.kcal)} (${calculation.targetSource === 'plan' ? 'your target' : 'the calculation'})` : '—' },
    { label: 'Daily portions', value: calculation ? describeMealPortions(calculation.dailyPortions, false) : '—' },
  ];
}

/** Nutrition builder: why the AI drafted these meals, and what it was given. Coach-only. */
export function NutritionAiRationale({ traineeId, recommendationId, recommendation }: NutritionAiRationaleProps) {
  const known = recommendation?.id === recommendationId ? recommendation : null;
  const load = useCallback(
    () => (known ? Promise.resolve(known) : getAiRecommendation(traineeId, recommendationId)),
    [known, traineeId, recommendationId],
  );
  const { data: loaded, error } = useLoad(load, AI_DRAFT_COPY.loadError);
  const data = loaded?.type === 'nutrition_plan' ? loaded : null;
  const output = data?.output;

  return (
    <details className="nutrition-ai-rationale">
      <summary className="nutrition-ai-rationale-summary">
        <span className="nutrition-ai-rationale-title">{NUTRITION_AI_COPY.rationaleTitle}</span>
        <Badge tone="alert">{AI_DRAFT_COPY.reviewBadge}</Badge>
      </summary>

      {error && <p className="nutrition-ai-rationale-muted">{error}</p>}
      {loaded && !output && <p className="nutrition-ai-rationale-muted">{AI_DRAFT_COPY.loadError}</p>}

      {output && (
        <div className="nutrition-ai-rationale-body">
          {output.meals.map((meal, mealIndex) => (
            <div key={`${meal.name}-${mealIndex}`} className="nutrition-ai-rationale-meal">
              <p className="nutrition-ai-rationale-meal-title">
                {meal.name} · {describeMealPortions(meal.portions, meal.vegetablesFree)}
              </p>
              <p className="nutrition-ai-rationale-muted" dir="auto">
                {meal.why}
              </p>
              <ul className="nutrition-ai-rationale-list">
                {meal.options.map((option) => (
                  <li key={option.label}>
                    <span className="nutrition-ai-rationale-option">{option.label}:</span>{' '}
                    <span dir="auto">
                      {option.lines
                        .map((line) =>
                          line.food
                            ? `${line.food.name} — ${describePortionAmount(line.food.portion, line.portions)}${line.food.archived ? ` (${NUTRITION_AI_COPY.archivedFood})` : ''}`
                            : NUTRITION_AI_COPY.missingFood,
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
              <summary className="nutrition-ai-rationale-heading">{NUTRITION_AI_COPY.inputTitle}</summary>
              <p className="nutrition-ai-rationale-muted">{NUTRITION_AI_COPY.inputNoIdentity}</p>
              <dl className="nutrition-ai-rationale-facts">
                {inputRows(data.input).map((row) => (
                  <div key={row.label} className="nutrition-ai-rationale-fact">
                    <dt>{row.label}</dt>
                    <dd dir="auto">{row.value}</dd>
                  </div>
                ))}
                <div className="nutrition-ai-rationale-fact">
                  <dt>{NUTRITION_AI_COPY.foodsSent}</dt>
                  <dd>
                    {PORTION_GROUPS.map((group) => `${FOOD_GROUP_LABELS[group]} ${data.input!.foods[group].sent} (${data.input!.foods[group].filteredOut})`).join(' · ')}
                  </dd>
                </div>
                <div className="nutrition-ai-rationale-fact">
                  <dt>{NUTRITION_AI_COPY.excludedTags}</dt>
                  <dd>{data.input.excludedTags.map((tag) => DIET_TAG_LABELS[tag]).join(', ') || '—'}</dd>
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
