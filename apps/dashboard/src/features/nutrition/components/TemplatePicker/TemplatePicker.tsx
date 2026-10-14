import { useState } from 'react';
import type { NutritionTemplate } from '@sistem/types';
import { useCopy } from '@sistem/shared';
import { nutritionCopy } from '../../copy';
import './TemplatePicker.css';

/** Start from a template: pick one, then apply (the editor asks before replacing her meals). */
export function TemplatePicker({ templates, onApply }: { templates: NutritionTemplate[]; onApply: (templateId: string) => Promise<boolean> }) {
  const copy = useCopy(nutritionCopy);
  const [templateId, setTemplateId] = useState('');
  return (
    <div className="nb-template-picker">
      <select className="nb-template-select" value={templateId} aria-label={copy.templatePick} onChange={(event) => setTemplateId(event.target.value)}>
        <option value="">{copy.templatePick}</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      <button className="nb-template-apply" type="button" disabled={!templateId} onClick={async () => (await onApply(templateId)) && setTemplateId('')}>
        {copy.templateApply}
      </button>
    </div>
  );
}
