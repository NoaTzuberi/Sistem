import type { KeyNumber } from '../../data/questionnaireProfile';
import './KeyNumbers.css';

interface KeyNumbersProps {
  numbers: KeyNumber[];
}

/** The numbers a coach reads first — age, height, weight, days a week — big and light. Only the ones she gave. */
export function KeyNumbers({ numbers }: KeyNumbersProps) {
  if (numbers.length === 0) return null;
  return (
    <dl className="key-numbers">
      {numbers.map((entry) => (
        <div key={entry.id} className="key-number">
          <dt>{entry.label}</dt>
          <dd>
            {/* Numbers read left to right in Hebrew too ("2–3"). */}
            <span className="key-number-value" dir="ltr">
              {entry.value}
            </span>
            {entry.unit && <span className="key-number-unit">{entry.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
