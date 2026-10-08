import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import './AccordionSection.css';

interface AccordionSectionProps {
  title: string;
  /** Shown under the title while the section is closed (e.g. "Vegetarian · Kosher"). */
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** One collapsible section of a long step. Opening it brings it into view. */
export function AccordionSection({ title, summary, isOpen, onToggle, children }: AccordionSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const panelId = useId();
  const wasOpen = useRef(isOpen);

  useEffect(() => {
    // Only when she opens it — not when the screen first renders it open.
    if (isOpen && !wasOpen.current) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sectionRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  return (
    <section ref={sectionRef} className={'accordion-section' + (isOpen ? ' accordion-section-open' : '')}>
      <button type="button" className="accordion-section-header" aria-expanded={isOpen} aria-controls={panelId} onClick={onToggle}>
        <span className="accordion-section-heading">
          <span className="accordion-section-title">{title}</span>
          {!isOpen && (
            <span className="accordion-section-summary" dir="auto">
              {summary}
            </span>
          )}
        </span>
        <IconChevronDown className="accordion-section-chevron" size={20} aria-hidden="true" />
      </button>
      {isOpen && (
        <div id={panelId} className="accordion-section-panel">
          {children}
        </div>
      )}
    </section>
  );
}
