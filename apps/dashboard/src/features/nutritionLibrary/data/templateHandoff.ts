// "Use for a new plan" (nutrition library → a trainee's builder): the template travels in router
// state, and the builder applies it once on arrival through its own "start from a template" flow.
export const TEMPLATE_STATE_KEY = 'applyTemplateId';

/** The template id router state carries, if any. */
export function templateIdFromState(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;
  const value = (state as Record<string, unknown>)[TEMPLATE_STATE_KEY];
  return typeof value === 'string' ? value : null;
}
