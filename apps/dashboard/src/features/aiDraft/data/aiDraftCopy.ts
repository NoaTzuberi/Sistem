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

export const AI_STATUS_LABELS: Record<AiRecommendationStatus, string> = {
  pending: 'Queued',
  running: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
};

/** How often the card checks a draft that is still being generated. */
export const AI_DRAFT_POLL_MS = 4000;
