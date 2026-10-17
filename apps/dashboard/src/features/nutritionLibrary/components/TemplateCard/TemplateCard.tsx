import type { NutritionTemplate, PortionGroup } from '@sistem/types';
import { PORTION_GROUPS, fill, formatDate, formatKcal, formatPortionCount, sharedCopy, useCopy, useI18n } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionLibraryCopy } from '../../copy';
import './TemplateCard.css';

interface TemplateCardProps {
  template: NutritionTemplate;
  onUse: (template: NutritionTemplate) => void;
  onRename: (template: NutritionTemplate) => void;
  onDelete: (template: NutritionTemplate) => void;
}

/** The day's portions per group: every meal's portions added up. */
function dayPortions(template: NutritionTemplate): { group: PortionGroup; count: number }[] {
  return PORTION_GROUPS.map((group) => ({ group, count: template.meals.reduce((sum, meal) => sum + meal.portions[group], 0) })).filter(
    (entry) => entry.count > 0,
  );
}

/** One template: its meals and kcal, the day's portions per group, when it changed, and "use for a new plan". */
export function TemplateCard({ template, onUse, onRename, onDelete }: TemplateCardProps) {
  const { language, plural } = useI18n();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(nutritionLibraryCopy);
  return (
    <article className="template-card">
      <div className="template-card-top">
        <span className="template-card-icon" aria-hidden="true">
          <Icon name="template" />
        </span>
        <span className="template-card-actions">
          <button
            className="template-card-action"
            type="button"
            aria-label={fill(copy.renameNamed, { name: template.name })}
            onClick={() => onRename(template)}
          >
            <Icon name="pencil" size="sm" />
          </button>
          <button
            className="template-card-action"
            type="button"
            aria-label={fill(copy.deleteNamed, { name: template.name })}
            onClick={() => onDelete(template)}
          >
            <Icon name="trash" size="sm" />
          </button>
        </span>
      </div>
      <h3 className="template-card-name" dir="auto">
        {template.name}
      </h3>
      {template.description && (
        <p className="template-card-description" dir="auto">
          {template.description}
        </p>
      )}
      <p className="template-card-meta">
        {plural(shared.nutrition.meals, template.meals.length)} · <bdi className="template-card-kcal">{formatKcal(template.kcal.day, language)}</bdi>
      </p>
      <ul className="template-card-portions">
        {dayPortions(template).map(({ group, count }) => (
          <li key={group} className={`template-card-portion food-group-${group}`}>
            <b dir="ltr">{formatPortionCount(count)}</b> {shared.nutrition.groups[group]}
          </li>
        ))}
      </ul>
      <p className="template-card-updated">{fill(copy.templateUpdated, { date: formatDate(template.updatedAt, language) })}</p>
      <button className="template-card-use" type="button" onClick={() => onUse(template)}>
        {copy.useTemplate}
        <Icon name="chevron" size="sm" flip />
      </button>
    </article>
  );
}
