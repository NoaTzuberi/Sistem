import type { NutritionTemplate } from '@sistem/types';
import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { PillButton } from '../../../../components/common/PillButton/PillButton';
import { TemplateCard } from '../TemplateCard/TemplateCard';
import { nutritionLibraryCopy } from '../../copy';
import './TemplatesGrid.css';

interface TemplatesGridProps {
  templates: NutritionTemplate[];
  onUse: (template: NutritionTemplate) => void;
  onRename: (template: NutritionTemplate) => void;
  onDelete: (template: NutritionTemplate) => void;
  /** The empty state's way in: pick a trainee, then her builder (where "Save as template" is). */
  onOpenBuilder: () => void;
}

/** The coach's templates as cards — or, with none yet, a pastel empty state that says where they come from. */
export function TemplatesGrid({ templates, onUse, onRename, onDelete, onOpenBuilder }: TemplatesGridProps) {
  const copy = useCopy(nutritionLibraryCopy);
  if (templates.length === 0) {
    return (
      <section className="templates-empty" aria-labelledby="templates-empty-title">
        <span className="templates-empty-art" aria-hidden="true">
          <i className="templates-empty-blob templates-empty-blob-main" />
          <i className="templates-empty-blob templates-empty-blob-peach" />
          <i className="templates-empty-blob templates-empty-blob-lilac" />
          <Icon name="template" className="templates-empty-icon" />
        </span>
        <h2 className="templates-empty-title" id="templates-empty-title">
          {copy.templatesEmptyTitle}
        </h2>
        <p className="templates-empty-text">{copy.templatesEmptyText}</p>
        <PillButton variant="primary" onClick={onOpenBuilder}>
          {copy.openBuilder}
        </PillButton>
      </section>
    );
  }
  return (
    <ul className="templates-grid">
      {templates.map((template) => (
        <li key={template.id} className="templates-grid-cell">
          <TemplateCard template={template} onUse={onUse} onRename={onRename} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
