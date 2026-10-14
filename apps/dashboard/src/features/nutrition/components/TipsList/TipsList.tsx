import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useCopy } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { nutritionCopy } from '../../copy';
import { newTip } from '../../nutritionDraft';
import type { DraftTip } from '../../nutritionDraft';
import './TipsList.css';

// The server's limit (nutrition.constants MAX_TIPS).
const MAX_TIPS = 20;

/** The coach's tips as warm rows (each still editable), and a field that adds one on Enter. */
export function TipsList({ tips, onChange }: { tips: DraftTip[]; onChange: (tips: DraftTip[]) => void }) {
  const copy = useCopy(nutritionCopy);
  const b = copy.builder;
  const [text, setText] = useState('');
  const canAdd = text.trim().length > 0 && tips.length < MAX_TIPS;

  function add() {
    if (!canAdd) return;
    onChange([...tips, { ...newTip(), text: text.trim() }]);
    setText('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    add();
  }

  return (
    <div className="nb-tips">
      <h3 className="nb-subtitle">{copy.tipsTitle}</h3>
      {tips.length > 0 && (
        <ul className="nb-tips-list">
          {tips.map((tip, index) => (
            <li key={tip.key} className="nb-tip">
              <span aria-hidden="true">💡</span>
              <input
                className="nb-inline-input"
                dir="auto"
                value={tip.text}
                aria-label={`${copy.tipsTitle} ${index + 1}`}
                onChange={(event) => onChange(tips.map((current, i) => (i === index ? { ...current, text: event.target.value } : current)))}
              />
              <button className="nb-tip-remove" type="button" aria-label={copy.removeTip} onClick={() => onChange(tips.filter((_, i) => i !== index))}>
                <Icon name="close" size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="nb-tip-add">
        <input
          className="nb-tip-input"
          dir="auto"
          value={text}
          placeholder={b.tipPlaceholder}
          aria-label={copy.addTip}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="nb-pill-button" type="button" disabled={!canAdd} onClick={add}>
          {b.tipAdd}
        </button>
      </div>
    </div>
  );
}
