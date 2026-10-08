import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CoachNutritionPlanResponse, NutritionTemplate } from '@sistem/types';
import { formatDateTime } from '@sistem/shared';
import { saveNutritionTemplate } from '../../../../services/coach/coachService';
import { traineePath } from '../../../../app/config/routes';
import { Button } from '../../../../components/common/Button/Button';
import { Badge } from '../../../../components/common/Badge/Badge';
import { SaveIndicator } from '../../../planBuilder/components/SaveIndicator/SaveIndicator';
import { useNutritionEditor } from '../../hooks/useNutritionEditor';
import { CalorieTargetPanel } from '../CalorieTargetPanel/CalorieTargetPanel';
import { MealEditor } from '../MealEditor/MealEditor';
import { TipsEditor } from '../TipsEditor/TipsEditor';
import { PreferencesPanel } from '../PreferencesPanel/PreferencesPanel';
import { IssueList } from '../IssueList/IssueList';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
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
 * The nutrition plan builder (PRD §5.6): calorie target, meals with portions per group,
 * options, tips, templates and publish. Autosaves; the server computes the kcal and the
 * publish issues, which are shown as of the last save.
 */
export function NutritionEditor({ traineeId, traineeName, initial, templates }: NutritionEditorProps) {
  const editor = useNutritionEditor(traineeId, initial);
  const { response, draft, updateDraft, saveStatus, isDirty } = editor;
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [message, setMessage] = useState<string>();
  const [isPublishing, setIsPublishing] = useState(false);

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

  async function handlePublish() {
    if (!window.confirm(NUTRITION_COPY.publishConfirm(traineeName))) return;
    setIsPublishing(true);
    setMessage(undefined);
    await editor.publish();
    setIsPublishing(false);
  }

  async function handleApplyTemplate() {
    if (!templateId) return;
    if (draft.meals.length > 0 && !window.confirm(NUTRITION_COPY.templateReplaceConfirm)) return;
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
      setMessage(NUTRITION_COPY.templateSaved(template.name));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't save the template.");
    }
  }

  return (
    <div className="nutrition-editor">
      <Link className="nutrition-back" to={traineePath(traineeId, 'nutrition')}>
        {NUTRITION_COPY.backToTrainee}
      </Link>

      <header className="nutrition-header">
        <div className="nutrition-heading">
          <h1 className="nutrition-title">{NUTRITION_COPY.builderTitle(traineeName)}</h1>
          <span className="nutrition-status">
            {plan && plan.publishedVersion > 0 && plan.publishedAt
              ? NUTRITION_COPY.statusPublished(plan.publishedVersion, formatDateTime(plan.publishedAt))
              : NUTRITION_COPY.statusNever}
          </span>
          {plan && plan.publishedVersion > 0 && plan.changedSincePublish && <Badge tone="accent">{NUTRITION_COPY.statusChanged}</Badge>}
        </div>
        <div className="nutrition-actions">
          <SaveIndicator status={saveStatus} />
          <Button variant="primary" onClick={handlePublish} disabled={!canPublish || isPublishing}>
            {plan && plan.publishedVersion > 0 ? NUTRITION_COPY.publishUpdate : NUTRITION_COPY.publish}
          </Button>
        </div>
      </header>

      {editor.error && (
        <div className="nutrition-error" role="alert">
          <p>{editor.error}</p>
          <IssueList issues={editor.saveIssues} />
        </div>
      )}
      {nothingNew && !isDirty && <p className="nutrition-note">{NUTRITION_COPY.nothingToPublish}</p>}
      {message && (
        <p className="nutrition-note" role="status">
          {message}
        </p>
      )}

      <div className="nutrition-layout">
        <div className="nutrition-main">
          <CalorieTargetPanel
            traineeId={traineeId}
            target={draft.target}
            onChange={setTarget}
            floorKcal={response.config.floorKcal}
            dayKcal={plan?.kcal.day ?? null}
          />

          <section className="nutrition-templates" aria-label={NUTRITION_COPY.templateTitle}>
            <select className="nutrition-select" value={templateId} onChange={(event) => setTemplateId(event.target.value)} aria-label={NUTRITION_COPY.templatePick}>
              <option value="">{NUTRITION_COPY.templatePick}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleApplyTemplate} disabled={!templateId}>
              {NUTRITION_COPY.templateApply}
            </Button>
          </section>

          <section className="nutrition-meals" aria-labelledby="nutrition-meals-title">
            <h2 className="nutrition-panel-title" id="nutrition-meals-title">
              {NUTRITION_COPY.mealsTitle}
            </h2>
            {draft.meals.length === 0 && <p className="nutrition-note">{NUTRITION_COPY.noMeals}</p>}
            {draft.meals.map((meal, index) => (
              <MealEditor
                key={meal.key}
                meal={meal}
                index={index}
                count={draft.meals.length}
                foods={response.foods}
                foodsById={foodsById}
                kcal={meal.id ? mealKcal.get(meal.id) : undefined}
                issues={response.issues.filter((issue) => issue.mealIndex === index)}
                onChange={(next) => updateDraft((current) => ({ ...current, meals: current.meals.map((m, i) => (i === index ? next : m)) }))}
                onRemove={() => updateDraft((current) => ({ ...current, meals: current.meals.filter((_, i) => i !== index) }))}
                onMove={(offset) => updateDraft((current) => ({ ...current, meals: move(current.meals, index, offset) }))}
              />
            ))}
            <Button size="sm" onClick={() => updateDraft((current) => ({ ...current, meals: [...current.meals, newMeal(`Meal ${current.meals.length + 1}`)] }))}>
              {NUTRITION_COPY.addMeal}
            </Button>
          </section>

          <TipsEditor tips={draft.tips} onChange={(tips) => updateDraft((current) => ({ ...current, tips }))} />
        </div>

        <aside className="nutrition-side">
          <PreferencesPanel preferences={response.preferences} />

          <section aria-labelledby="nutrition-issues-title">
            <h2 className="nutrition-panel-title" id="nutrition-issues-title">
              {NUTRITION_COPY.issuesTitle}
            </h2>
            {plan && response.issues.length === 0 ? (
              <p className="nutrition-note">{NUTRITION_COPY.noIssues}</p>
            ) : (
              <IssueList issues={response.issues.filter((issue) => issue.mealIndex === undefined || issue.severity === 'error')} />
            )}
          </section>

          <section className="nutrition-save-template" aria-label={NUTRITION_COPY.saveAsTemplate}>
            <input
              className="nutrition-input"
              dir="auto"
              value={templateName}
              placeholder={NUTRITION_COPY.templateName}
              aria-label={NUTRITION_COPY.templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <Button size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim() || draft.meals.length === 0}>
              {NUTRITION_COPY.saveAsTemplate}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
