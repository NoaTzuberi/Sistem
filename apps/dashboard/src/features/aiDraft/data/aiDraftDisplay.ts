import type { aiDraftCopy } from '../copy';

/** How often the card checks a draft that is still being generated. */
export const AI_DRAFT_POLL_MS = 4000;

/** 'allergy:other' → 'Allergy — other'; 'foods_disliked' → 'Foods she dislikes'. */
export function freeTextSourceLabel(source: string, copy: (typeof aiDraftCopy)['he']): string {
  if (source === 'foods_loved') return copy.freeText.foodsLoved;
  if (source === 'foods_disliked') return copy.freeText.foodsDisliked;
  const [section, id] = source.split(':');
  const sectionLabel = (copy.freeText as Record<string, string>)[section] ?? section;
  return copy.freeText.sectionItem.replace('{section}', sectionLabel).replace('{item}', (id ?? '').replace(/_/g, ' '));
}
