import { useId } from 'react';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import './IntroEditor.css';

// The server's limit (nutrition.constants MAX_INTRO_MESSAGE_LENGTH).
const MAX_INTRO_LENGTH = 1500;

interface IntroEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/** The coach's note at the top of her Nutrition tab (13a+) — plain text, line breaks kept. */
export function IntroEditor({ value, onChange }: IntroEditorProps) {
  const id = useId();
  return (
    <section className="intro-editor" aria-labelledby={`${id}-title`}>
      <h2 className="nutrition-panel-title" id={`${id}-title`}>
        {NUTRITION_COPY.introTitle}
      </h2>
      <p className="intro-editor-hint">{NUTRITION_COPY.introHint}</p>
      <textarea
        className="intro-editor-input"
        aria-labelledby={`${id}-title`}
        dir="auto"
        rows={5}
        maxLength={MAX_INTRO_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="intro-editor-count">{NUTRITION_COPY.introCount(value.length, MAX_INTRO_LENGTH)}</span>
    </section>
  );
}
