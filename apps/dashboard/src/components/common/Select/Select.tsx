import type { Ref, SelectHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import './Select.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** soft = grey, on a white card · card = white, on a grey / tinted surface · bare = no pill, inside a field tile. */
  variant?: 'soft' | 'card' | 'bare';
  ref?: Ref<HTMLSelectElement>;
}

/**
 * The dashboard's select: a rounded pill with our own chevron at the reading end. The list itself
 * stays the browser's (keyboard, screen readers and touch all work as they should). `className` places
 * the pill; the select inside fills it.
 */
export function Select({ variant = 'soft', className, children, ...rest }: SelectProps) {
  return (
    <span className={['select', `select-${variant}`, className].filter(Boolean).join(' ')}>
      <select className="select-input" {...rest}>
        {children}
      </select>
      <Icon name="chevronDown" size="sm" className="select-chevron" />
    </span>
  );
}
