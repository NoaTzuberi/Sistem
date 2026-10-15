import { useCallback, useState } from 'react';
import type { NutritionDraft } from '../nutritionDraft';

// Hiding the banner is remembered per trainee and draft, on this browser only (a convenience).
const keyFor = (traineeId: string) => `sistem.nutrition.aiDismissed.${traineeId}`;

function readDismissed(traineeId: string): string | null {
  try {
    return window.localStorage.getItem(keyFor(traineeId));
  } catch {
    return null;
  }
}

type Snapshot = Pick<NutritionDraft, 'meals' | 'aiRecommendationId' | 'target'>;

/**
 * The AI draft banner's own state: hidden for this draft or not, and — after "apply" in this
 * session — what the plan was before, so the apply can be undone.
 */
export function useAiDraftBanner(traineeId: string, draftId: string | null) {
  const [dismissedId, setDismissedId] = useState(() => readDismissed(traineeId));
  const [before, setBefore] = useState<{ id: string; snapshot: Snapshot } | null>(null);

  const dismiss = useCallback(() => {
    if (!draftId) return;
    setDismissedId(draftId);
    try {
      window.localStorage.setItem(keyFor(traineeId), draftId);
    } catch {
      // Private mode: hidden for this visit only.
    }
  }, [traineeId, draftId]);

  const show = useCallback(() => {
    setDismissedId(null);
    try {
      window.localStorage.removeItem(keyFor(traineeId));
    } catch {
      // Nothing stored.
    }
  }, [traineeId]);

  return {
    isDismissed: draftId !== null && dismissedId === draftId,
    dismiss,
    show,
    /** Remember the plan as it is right before the draft is applied. */
    rememberBefore: (id: string, snapshot: Snapshot) => setBefore({ id, snapshot }),
    /** The plan before this draft was applied, while it can still be put back. */
    undoFor: (id: string) => (before?.id === id ? before.snapshot : null),
    clearUndo: () => setBefore(null),
  };
}
