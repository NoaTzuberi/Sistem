import type { FocusEvent, InputHTMLAttributes } from 'react';
import { useId } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// The on-screen keyboard opens after focus and shrinks the viewport, so wait for it
// before bringing the field back into view.
const KEYBOARD_OPEN_DELAY_MS = 300;

export function Input({ label, error, helperText, id, className, onFocus, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const classNames = ['input-field', error ? 'input-field-error' : '', className]
    .filter(Boolean)
    .join(' ');

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus?.(event);
    const field = event.currentTarget;
    window.setTimeout(() => {
      if (document.activeElement === field) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, KEYBOARD_OPEN_DELAY_MS);
  }

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className={classNames} onFocus={handleFocus} {...rest} />
      {error ? (
        <span className="input-error">{error}</span>
      ) : helperText ? (
        <span className="input-helper">{helperText}</span>
      ) : null}
    </div>
  );
}
