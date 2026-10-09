import { describeMealPortions, fill, formatKcal, sharedCopy, useCopy, useLanguage, useLoad } from '@sistem/shared';
import { deleteNutritionTemplate, listNutritionTemplates } from '../../../../services/coach/coachService';
import { Button } from '../../../../components/common/Button/Button';
import { NutritionSubnav } from '../../components/NutritionSubnav/NutritionSubnav';
import { nutritionCopy } from '../../copy';
import './NutritionTemplatesPage.css';

/** The coach's nutrition templates. Saving and applying happen in a trainee's builder. */
export function NutritionTemplatesPage() {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionCopy);
  const { data, error, isLoading, reload } = useLoad(listNutritionTemplates, copy.templatesLoadError);

  async function remove(id: string, name: string) {
    if (!window.confirm(fill(copy.deleteTemplateConfirm, { name }))) return;
    await deleteNutritionTemplate(id);
    reload();
  }

  return (
    <div className="nutrition-templates-page">
      <NutritionSubnav />
      <h1 className="nutrition-templates-title">{copy.templatesTitle}</h1>
      <p className="nutrition-templates-note">{copy.templatesIntro}</p>

      {isLoading && !data && <p>{shared.common.loading}</p>}
      {error && !data && (
        <p role="alert">
          {error} <Button size="sm" onClick={reload}>{shared.common.retry}</Button>
        </p>
      )}
      {data?.length === 0 && <p className="nutrition-templates-note">{copy.templatesEmpty}</p>}

      <ul className="nutrition-templates-list">
        {data?.map((template) => (
          <li key={template.id} className="nutrition-template">
            <div className="nutrition-template-head">
              <h2 className="nutrition-template-name" dir="auto">
                <bdi>{template.name}</bdi>
              </h2>
              <span className="nutrition-templates-note">
                {template.targetKcal !== null && `${formatKcal(template.targetKcal, language)} · `}
                {copy.dayTotal} {formatKcal(template.kcal.day, language)}
              </span>
              <Button size="sm" variant="danger" onClick={() => remove(template.id, template.name)}>
                {copy.deleteTemplate}
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
                  <strong dir="auto">{meal.name}</strong> — {describeMealPortions(meal.portions, meal.vegetablesFree, language)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
