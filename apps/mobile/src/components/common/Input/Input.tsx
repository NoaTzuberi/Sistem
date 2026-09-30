import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const classNames = ['input-field', error ? 'input-field-error' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className={classNames} {...rest} />
      {error ? (
        <span className="input-error">{error}</span>
      ) : helperText ? (
        <span className="input-helper">{helperText}</span>
      ) : null}
    </div>
  );
}
