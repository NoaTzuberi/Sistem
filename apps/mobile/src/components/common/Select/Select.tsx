import type { SelectHTMLAttributes } from 'react';
import { useId } from 'react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, options, placeholder, id, className, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const classNames = ['select-field', className].filter(Boolean).join(' ');

  return (
    <div className="select-group">
      {label && (
        <label className="select-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className={classNames} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
