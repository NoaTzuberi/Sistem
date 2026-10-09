import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AiNutritionRecommendation, CoachNutritionPlanResponse, NutritionTemplate } from '@sistem/types';
import { fill, formatDateTime, useCopy, useLanguage } from '@sistem/shared';
import { saveNutritionTemplate } from '../../../../services/coach/coachService';
import { traineePath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { SaveIndicator } from '../../../planBuilder/components/SaveIndicator/SaveIndicator';
import { useNutritionEditor } from '../../hooks/useNutritionEditor';
import { useLatestAiDraft } from '../../../aiDraft/hooks/useLatestAiDraft';
import { NutritionAiDraftCard } from '../../../aiDraft/components/NutritionAiDraftCard/NutritionAiDraftCard';
import { NutritionAiRationale } from '../../../aiDraft/components/NutritionAiRationale/NutritionAiRationale';
import { draftMealsFromAi } from '../../../aiDraft/aiDraftToNutrition';
import { aiDraftCopy } from '../../../aiDraft/copy';
import { CalculationSummary } from '../CalculationSummary/CalculationSummary';
import { IntroEditor } from '../IntroEditor/IntroEditor';
import { MealEditor } from '../MealEditor/MealEditor';
import { TipsEditor } from '../TipsEditor/TipsEditor';
import { PreferencesPanel } from '../PreferencesPanel/PreferencesPanel';
import { IssueList } from '../IssueList/IssueList';
import { nutritionCopy } from '../../copy';
import { move, newMeal } from '../../nutritionDraft';
import type { NutritionDraft } from '../../nutritionDraft';
import './NutritionEditor.css';

interface NutritionEditorProps {
  traineeId: string;
  traineeName: string;
  initial: CoachNutritionPlanResponse;
  templates: NutritionTemplate[];
}

/**
 * The nutrition plan builder (PRD §5.6): the calculation summary and target, the coach's
 * message, meals with portions per group,
 * options, tips, templates, the AI draft (13c) and publish. Autosaves; the server computes the kcal and the
 * publish issues, which are shown as of the last save.
 */
export function NutritionEditor({ traineeId, traineeName, initial, templates }: NutritionEditorProps) {
  const language = useLanguage();
  const aiDraftText = useCopy(aiDraftCopy);
  const copy = useCopy(nutritionCopy);
  const editor = useNutritionEditor(traineeId, initial);
  const { response, draft, updateDraft, saveStatus, isDirty } = editor;
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [message, setMessage] = useState<string>();
  const [isPublishing, setIsPublishing] = useState(false);
  const ai = useLatestAiDraft(traineeId, 'nutrition_plan');

  const foodsById = useMemo(() => new Map(response.foods.map((food) => [food.id, food])), [response.foods]);
  const mealKcal = useMemo(
    () => new Map((response.plan?.kcal.meals ?? []).map((meal) => [meal.mealId, meal.kcal])),
    [response.plan],
  );
  const plan = response.plan;
  const hasErrors = response.issues.some((issue) => issue.severity === 'error');
  const nothingNew = plan !== null && plan.publishedVersion > 0 && !plan.changedSincePublish;
  const canPublish = isDirty || (plan !== null && !hasErrors && !nothingNew);

  function setTarget(patch: Partial<NutritionDraft['target']>) {
    updateDraft((current) => ({ ...current, target: { ...current.target, ...patch } }));
  }

  /**
   * The AI draft's meals replace hers in the editable working copy (autosaved like any edit,
   * never published by this). Target, message and tips stay; a plan without a target takes
   * the one the draft was built for.
   */
  function handleLoadAiDraft(recommendation: AiNutritionRecommendation) {
    const output = recommendation.output;
    if (!output) return;
    const hasContent = plan !== null || draft.meals.some((meal) => meal.options.length > 0);
    if (hasContent && !window.confirm(aiDraftText.nutrition.replaceConfirm)) return;
    updateDraft((current) => ({
      ...current,
      meals: draftMealsFromAi(output),
      aiRecommendationId: recommendation.id,
      target: current.target.kcal === undefined ? { ...current.target, kcal: output.kcal, source: 'suggested' } : current.target,
    }));
  }

  async function handlePublish() {
    if (!window.confirm(fill(copy.publishConfirm, { name: traineeName }))) return;
    setIsPublishing(true);
    setMessage(undefined);
    await editor.publish();
    setIsPublishing(false);
  }

  async function handleApplyTemplate() {
    if (!templateId) return;
    if (draft.meals.length > 0 && !window.confirm(copy.templateReplaceConfirm)) return;
    if (await editor.applyTemplate(templateId)) setTemplateId('');
  }

  async function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) return;
    setMessage(undefined);
    try {
      if (!(await editor.save())) return;
      const template = await saveNutritionTemplate(traineeId, { name });
      setTemplateName('');
      setMessage(fill(copy.templateSaved, { name: template.name }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.templateSaveError);
    }
  }

  return (
    <div className="nutrition-editor">
      <Link className="nutrition-back" to={traineePath(traineeId, 'nutrition')}>
        {copy.backToTrainee}
      </Link>

      <header className="nutrition-header">
        <div className="nutrition-heading">
          <h1 className="nutrition-title">{fill(copy.builderTitle, { name: traineeName })}</h1>
          <span className="nutrition-status">
            {plan && plan.publishedVersion > 0 && plan.publishedAt
              ? fill(copy.statusPublished, { version: plan.publishedVersion, date: formatDateTime(plan.publishedAt, language) })
              : copy.statusNever}
          </span>
          {plan && plan.publishedVersion > 0 && plan.changedSincePublish && <Badge tone="accent">{copy.statusChanged}</Badge>}
          {draft.aiRecommendationId && <Badge tone="alert">{aiDraftText.nutrition.loadedBadge}</Badge>}
        </div>
        <div className="nutrition-actions">
          <SaveIndicator status={saveStatus} />
          <Button variant="primary" onClick={handlePublish} disabled={!canPublish || isPublishing}>
            {plan && plan.publishedVersion > 0 ? copy.publishUpdate : copy.publish}
          </Button>
        </div>
      </header>

      {editor.error && (
        <div className="nutrition-error" role="alert">
          <p>{editor.error}</p>
          <IssueList issues={editor.saveIssues} />
        </div>
      )}
      {nothingNew && !isDirty && <p className="nutrition-note">{copy.nothingToPublish}</p>}
      {message && (
        <p className="nutrition-note" role="status">
          {message}
        </p>
      )}

      <div className="nutrition-layout">
        <div className="nutrition-main">
          <CalculationSummary
            traineeId={traineeId}
            target={draft.target}
            onChange={setTarget}
            floorKcal={response.config.floorKcal}
            dayKcal={plan?.kcal.day ?? null}
            dayPortions={plan?.dayPortions ?? null}
          />

          <IntroEditor value={draft.introMessage} onChange={(introMessage) => updateDraft((current) => ({ ...current, introMessage }))} />

          <section className="nutrition-templates" aria-label={copy.templateTitle}>
            <select className="nutrition-select" value={templateId} onChange={(event) => setTemplateId(event.target.value)} aria-label={copy.templatePick}>
              <option value="">{copy.templatePick}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  <bdi>{template.name}</bdi>
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleApplyTemplate} disabled={!templateId}>
              {copy.templateApply}
            </Button>
          </section>

          <section className="nutrition-meals" aria-labelledby="nutrition-meals-title">
            <h2 className="nutrition-panel-title" id="nutrition-meals-title">
              {copy.mealsTitle}
            </h2>
            {draft.meals.length === 0 && <p className="nutrition-note">{copy.noMeals}</p>}
            {draft.meals.map((meal, index) => (
              <MealEditor
                key={meal.key}
                meal={meal}
                index={index}
                count={draft.meals.length}
                foods={response.foods}
                recentFoodIds={response.recentFoodIds}
                foodsById={foodsById}
                kcal={meal.id ? mealKcal.get(meal.id) : undefined}
                issues={response.issues.filter((issue) => issue.mealIndex === index)}
                onChange={(next) => updateDraft((current) => ({ ...current, meals: current.meals.map((m, i) => (i === index ? next : m)) }))}
                onRemove={() => updateDraft((current) => ({ ...current, meals: current.meals.filter((_, i) => i !== index) }))}
                onMove={(offset) => updateDraft((current) => ({ ...current, meals: move(current.meals, index, offset) }))}
              />
            ))}
            <Button size="sm" onClick={() => updateDraft((current) => ({ ...current, meals: [...current.meals, newMeal(`Meal ${current.meals.length + 1}`)] }))}>
              {copy.addMeal}
            </Button>
          </section>

          <TipsEditor tips={draft.tips} onChange={(tips) => updateDraft((current) => ({ ...current, tips }))} />
        </div>

        <aside className="nutrition-side">
          <NutritionAiDraftCard ai={ai} onLoad={handleLoadAiDraft} loadedId={draft.aiRecommendationId} />
          {draft.aiRecommendationId && (
            <NutritionAiRationale traineeId={traineeId} recommendationId={draft.aiRecommendationId} recommendation={ai.latest} />
          )}
          <PreferencesPanel preferences={response.preferences} />

          <section aria-labelledby="nutrition-issues-title">
            <h2 className="nutrition-panel-title" id="nutrition-issues-title">
              {copy.issuesTitle}
            </h2>
            {plan && response.issues.length === 0 ? (
              <p className="nutrition-note">{copy.noIssues}</p>
            ) : (
              <IssueList issues={response.issues.filter((issue) => issue.mealIndex === undefined || issue.severity === 'error')} />
            )}
          </section>

          <section className="nutrition-save-template" aria-label={copy.saveAsTemplate}>
            <input
              className="nutrition-input"
              dir="auto"
              value={templateName}
              placeholder={copy.templateName}
              aria-label={copy.templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <Button size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim() || draft.meals.length === 0}>
              {copy.saveAsTemplate}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
