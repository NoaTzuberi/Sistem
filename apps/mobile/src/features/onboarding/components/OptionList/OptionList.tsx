import { IconCheck } from '@tabler/icons-react';
import './OptionList.css';

interface OptionListProps<Id extends string> {
  /** Names the group for screen readers (the question or the group's label). */
  label: string;
  /** `single`: round radios. `multi`: rounded-square checkboxes. */
  kind: 'single' | 'multi';
  options: readonly { id: Id; label: string }[];
  selected: readonly string[];
  onToggle: (id: Id) => void;
  /** Long lists use two columns, so the card fits the screen. */
  columns?: 1 | 2;
}

/** A step's options as a clean list. What a tap does (toggle, replace, clear) is the step's own rule. */
export function OptionList<Id extends string>({ label, kind, options, selected, onToggle, columns = 1 }: OptionListProps<Id>) {
  const classNames = ['option-list', `option-list-${kind}`, columns === 2 ? 'option-list-two-columns' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role={kind === 'single' ? 'radiogroup' : 'group'} aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="option-list-option"
          role={kind === 'single' ? 'radio' : 'checkbox'}
          aria-checked={selected.includes(option.id)}
          onClick={() => onToggle(option.id)}
        >
          <span className="option-list-mark" aria-hidden="true">
            <IconCheck className="option-list-check" size={13} stroke={3.6} />
          </span>
          <span className="option-list-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
