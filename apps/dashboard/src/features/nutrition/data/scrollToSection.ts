import type { BuilderSection } from '../hooks/usePublishChecklist';

/** The id of a builder section (the step nav and the checklist jump to it). */
export function sectionId(section: BuilderSection): string {
  return `nb-section-${section}`;
}

/** Scrolls a section under the sticky header (its scroll-margin) and moves the focus to its heading. */
export function scrollToSection(section: BuilderSection): void {
  const element = document.getElementById(sectionId(section));
  if (!element) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  element.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}
