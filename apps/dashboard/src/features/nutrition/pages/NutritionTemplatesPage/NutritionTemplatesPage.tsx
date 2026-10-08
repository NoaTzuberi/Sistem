import { describeMealPortions, formatKcal, useLoad } from '@sistem/shared';
import { deleteNutritionTemplate, listNutritionTemplates } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { NutritionSubnav } from '../../components/NutritionSubnav/NutritionSubnav';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './NutritionTemplatesPage.css';

/** The coach's nutrition templates. Saving and applying happen in a trainee's builder. */
export function NutritionTemplatesPage() {
  const { data, error, isLoading, reload } = useLoad(listNutritionTemplates, "Couldn't load the templates.");

  async function remove(id: string, name: string) {
    if (!window.confirm(NUTRITION_COPY.deleteTemplateConfirm(name))) return;
    await deleteNutritionTemplate(id);
    reload();
  }

  return (
    <div className="nutrition-templates-page">
      <NutritionSubnav />
      <h1 className="nutrition-templates-title">{NUTRITION_COPY.templatesTitle}</h1>
      <p className="nutrition-templates-note">{NUTRITION_COPY.templatesIntro}</p>

      {isLoading && !data && <p>Loading…</p>}
      {error && !data && (
        <p role="alert">
          {error} <Button size="sm" onClick={reload}>Try again</Button>
        </p>
      )}
      {data?.length === 0 && <p className="nutrition-templates-note">{NUTRITION_COPY.templatesEmpty}</p>}

      <ul className="nutrition-templates-list">
        {data?.map((template) => (
          <li key={template.id} className="nutrition-template">
            <div className="nutrition-template-head">
              <h2 className="nutrition-template-name" dir="auto">
                {template.name}
              </h2>
              <span className="nutrition-templates-note">
                {template.targetKcal !== null && `${formatKcal(template.targetKcal)} · `}
                {NUTRITION_COPY.dayTotal} {formatKcal(template.kcal.day)}
              </span>
              <Button size="sm" variant="danger" onClick={() => remove(template.id, template.name)}>
                {NUTRITION_COPY.deleteTemplate}
              </Button>
            </div>
            {template.description && (
              <p className="nutrition-templates-note" dir="auto">
                {template.description}
              </p>
            )}
            <ul className="nutrition-template-meals">
              {template.meals.map((meal) => (
                <li key={meal.id}>
                  <strong dir="auto">{meal.name}</strong> — {describeMealPortions(meal.portions, meal.vegetablesFree)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
