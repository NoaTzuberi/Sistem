import type { FocusEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  statusText?: string;
  trailing?: ReactNode;
}

// The on-screen keyboard opens after focus and shrinks the viewport, so wait for it
// before bringing the field back into view.
const KEYBOARD_OPEN_DELAY_MS = 300;

export function Input({ label, error, helperText, statusText, trailing, id, className, onFocus, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const classNames = ['input-field', error ? 'input-field-error' : '', className]
    .filter(Boolean)
    .join(' ');
  const note = error ?? statusText ?? helperText;
  const noteId = `${inputId}-note`;

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
      <div className={'input-control' + (trailing ? ' input-control-trailing' : '')}>
        <input
          id={inputId}
          className={classNames}
          onFocus={handleFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? noteId : undefined}
          {...rest}
        />
        {trailing}
      </div>
      {note && (
        <span id={noteId} className={error ? 'input-error' : statusText ? 'input-status' : 'input-helper'}>
          {note}
        </span>
      )}
    </div>
  );
}
