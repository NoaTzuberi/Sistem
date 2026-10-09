import { sharedCopy, useCopy } from '@sistem/shared';
import type { HTMLAttributes } from 'react';
import './Spinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
}

export function Spinner({ size = 'md', className, ...rest }: SpinnerProps) {
  const classNames = ['spinner', `spinner-${size}`, className].filter(Boolean).join(' ');
  const copy = useCopy(sharedCopy);

  return <span className={classNames} role="status" aria-label={copy.common.loading} {...rest} />;
}
