import { Button } from '../../../../components/common/Button/Button';
import { NUTRITION_COPY } from '../../data/nutritionCopy';
import { newTip } from '../../nutritionDraft';
import type { DraftTip } from '../../nutritionDraft';
import './TipsEditor.css';

/** Free notes on the plan (e.g. the guide's protein tip and swap rule). */
export function TipsEditor({ tips, onChange }: { tips: DraftTip[]; onChange: (tips: DraftTip[]) => void }) {
  return (
    <section className="tips-editor" aria-labelledby="tips-editor-title">
      <h2 className="nutrition-panel-title" id="tips-editor-title">
        {NUTRITION_COPY.tipsTitle}
      </h2>
      {tips.map((tip, index) => (
        <div key={tip.key} className="tips-editor-row">
          <textarea
            className="tips-editor-input"
            dir="auto"
            rows={2}
            value={tip.text}
            aria-label={`${NUTRITION_COPY.tipsTitle} ${index + 1}`}
            onChange={(event) => onChange(tips.map((current, i) => (i === index ? { ...current, text: event.target.value } : current)))}
          />
          <Button size="sm" variant="danger" aria-label={NUTRITION_COPY.removeTip} onClick={() => onChange(tips.filter((_, i) => i !== index))}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...tips, newTip()])}>
        {NUTRITION_COPY.addTip}
      </Button>
    </section>
  );
}
