import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import './Section.css';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { className, children, ...rest },
  ref
) {
  const classNames = ['section', className].filter(Boolean).join(' ');

  return (
    <section ref={ref} className={classNames} {...rest}>
      {children}
    </section>
  );
});
