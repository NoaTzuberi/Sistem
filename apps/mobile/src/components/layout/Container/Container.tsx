import type { HTMLAttributes, ReactNode } from 'react';
import './Container.css';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({ className, children, ...rest }: ContainerProps) {
  const classNames = ['container', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
