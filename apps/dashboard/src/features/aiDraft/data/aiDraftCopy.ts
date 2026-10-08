import type { AiRecommendationStatus } from '@sistem/types';

// PLACEHOLDER wording (Phase 12) — the owner sends the final text.

export const AI_DRAFT_COPY = {
  title: 'AI draft',
  none: 'No AI draft for this trainee yet.',
  generate: 'Generate AI draft',
  regenerate: 'Regenerate',
  tryAgain: 'Try again',
  generating: 'Generating the draft… this can take a minute.',
  failedPrefix: "Couldn't generate an AI draft:",
  useInNewPlan: 'Use in a new plan',
  loadIntoPlan: 'Load AI draft',
  loadingRunning: 'AI draft generating…',
  replaceConfirm: 'Replace the workouts in this plan with the AI draft?',
  reviewNote: 'AI draft — review and edit everything before publishing. Only you see it; the trainee sees the plan only after you publish.',
  reviewBadge: 'AI draft — review before publishing',
  rationaleTitle: 'AI rationale',
  split: 'Split',
  considerations: 'Check with her',
  workouts: 'Workouts',
  inputTitle: 'What the AI was given',
  inputNoIdentity: 'Sent without her name, email, birth date or photos. Free text trimmed, emails and phone numbers removed.',
  missingExercise: 'Exercise no longer in the library',
  fromAiBadge: 'From AI draft',
  loadError: "Couldn't load the AI draft.",
} as const;

/** PLACEHOLDER wording (Phase 13c) — the AI nutrition draft in the nutrition builder. */
export const NUTRITION_AI_COPY = {
  title: 'AI nutrition draft',
  none: 'No AI nutrition draft for this trainee yet.',
  generating: 'Generating the nutrition draft… this can take a minute.',
  builtFor: (kcal: string, portions: string) => `Built for ${kcal} · ${portions} a day`,
  meals: (count: number) => `${count} meals`,
  load: 'Load AI draft',
  replaceConfirm: 'Replace the meals in this plan with the AI draft? Target, message and tips stay.',
  loadedBadge: 'Meals from AI draft',
  reviewNote: 'Review and edit everything before publishing. Only you see it; she sees the plan only after you publish.',
  considerations: 'Check with her',
  checkByHand: 'Check by hand — not checked by code',
  checkByHandNote: 'Her own words. The food list was filtered by her selected answers only.',
  notAnswered: "She didn't answer the nutrition step — the food list was not filtered.",
  rationaleTitle: 'AI rationale',
  inputTitle: 'What the AI was given',
  inputNoIdentity: 'Sent without her name, email, birth date or photos. Free text trimmed, emails and phone numbers removed. Calories and portions were computed in code.',
  foodsSent: 'Food items sent (filtered out by her answers)',
  excludedTags: 'Ruled out by her answers',
  missingFood: 'Item no longer in your list',
  archivedFood: 'archived',
} as const;

const FREE_TEXT_SECTION_LABELS: Record<string, string> = {
  diet_type: 'Diet',
  diet_style: 'Diet style',
  religious: 'Religious',
  intolerance: 'Intolerance',
  allergy: 'Allergy',
};

/** 'allergy:other' → 'Allergy — other'; 'foods_disliked' → 'Foods she dislikes'. */
export function freeTextSourceLabel(source: string): string {
  if (source === 'foods_loved') return 'Foods she loves';
  if (source === 'foods_disliked') return 'Foods she dislikes';
  const [section, id] = source.split(':');
  return `${FREE_TEXT_SECTION_LABELS[section] ?? section} — ${(id ?? '').replace(/_/g, ' ')}`;
}

export const AI_STATUS_LABELS: Record<AiRecommendationStatus, string> = {
  pending: 'Queued',
  running: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
};

/** How often the card checks a draft that is still being generated. */
export const AI_DRAFT_POLL_MS = 4000;
