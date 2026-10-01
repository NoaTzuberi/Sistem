import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Functional placeholder styling (tokens only) — the owner designs the real buttons.
export function Button({ variant = 'secondary', size = 'md', type = 'button', className, ...rest }: ButtonProps) {
  const classNames = ['button', `button-${variant}`, `button-${size}`, className].filter(Boolean).join(' ');
  return <button className={classNames} type={type} {...rest} />;
}
