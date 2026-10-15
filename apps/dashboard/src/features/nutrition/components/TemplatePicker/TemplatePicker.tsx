import { useEffect, useId, useRef, useState } from 'react';
import type { NutritionTemplate } from '@sistem/types';
import { formatKcal, useCopy, useI18n } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionCopy } from '../../copy';
import './TemplatePicker.css';

/** "Start from a template ▾": a menu of her templates (meals · kcal); choosing one applies it (the editor asks first when meals have content). */
export function TemplatePicker({ templates, onApply }: { templates: NutritionTemplate[]; onApply: (templateId: string) => Promise<boolean> }) {
  const { language, plural } = useI18n();
  const copy = useCopy(nutritionCopy);
  const b = copy.builder;
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Esc and a press outside close it; Esc gives the focus back to the button.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  async function choose(templateId: string) {
    setIsOpen(false);
    await onApply(templateId);
  }

  return (
    <div className="nb-template" ref={rootRef}>
      <button
        ref={buttonRef}
        className="nb-template-button"
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
      >
        {b.templateButton}
        <span className="nb-template-chevron" aria-hidden="true">
          <Icon name="chevronDown" size="sm" />
        </span>
      </button>
      {isOpen && (
        <div className="nb-template-menu" id={menuId} role="menu" aria-label={b.templateButton}>
          <p className="nb-template-note">{b.templateNote}</p>
          {templates.length === 0 && <p className="nb-template-empty">{b.templateEmpty}</p>}
          {templates.map((template) => (
            <button key={template.id} className="nb-template-item" type="button" role="menuitem" onClick={() => void choose(template.id)}>
              <span className="nb-template-name" dir="auto">
                {template.name}
              </span>
              <span className="nb-template-meta">
                {plural(b.mealCount, template.meals.length)} · <bdi>{formatKcal(template.kcal.day, language)}</bdi>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
