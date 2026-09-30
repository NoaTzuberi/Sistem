import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../Spinner/Spinner';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classNames = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          <span className="btn-label">{children}</span>
        </>
      )}
    </button>
  );
}
