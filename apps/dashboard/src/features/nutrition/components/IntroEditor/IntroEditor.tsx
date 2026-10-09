import { fill, formatNumber, useCopy, useLanguage } from '@sistem/shared';
import { useId } from 'react';
import { nutritionCopy } from '../../copy';
import './IntroEditor.css';

// The server's limit (nutrition.constants MAX_INTRO_MESSAGE_LENGTH).
const MAX_INTRO_LENGTH = 1500;

interface IntroEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/** The coach's note at the top of her Nutrition tab (13a+) — plain text, line breaks kept. */
export function IntroEditor({ value, onChange }: IntroEditorProps) {
  const language = useLanguage();
  const copy = useCopy(nutritionCopy);
  const id = useId();
  return (
    <section className="intro-editor" aria-labelledby={`${id}-title`}>
      <h2 className="nutrition-panel-title" id={`${id}-title`}>
        {copy.introTitle}
      </h2>
      <p className="intro-editor-hint">{copy.introHint}</p>
      <textarea
        className="intro-editor-input"
        aria-labelledby={`${id}-title`}
        dir="auto"
        rows={5}
        maxLength={MAX_INTRO_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="intro-editor-count">{fill(copy.introCount, { count: formatNumber(value.length, language), max: formatNumber(MAX_INTRO_LENGTH, language) })}</span>
    </section>
  );
}
