import { useMemo } from 'react';
import type { NutritionIssue } from '@sistem/types';
import type { NutritionDraft } from '../nutritionDraft';
import type { PortionBudget } from './usePortionBudget';

export type BuilderSection = 'target' | 'meals' | 'message';

export interface ChecklistItem {
  id: 'target' | 'meals' | 'issues' | 'portions' | 'message';
  section: BuilderSection;
  /** ok · todo (blocks publishing) · advice (worth fixing, does not block) · optional. */
  state: 'ok' | 'todo' | 'advice' | 'optional';
}

// The server's publish errors the checklist already shows as its own items.
const OWN_CODES = new Set(['target_missing', 'floor_unconfirmed', 'no_meals']);

/**
 * "Before publish", from the server's own rules (nutrition.validation): a target (and the floor
 * confirmed when it is below it) and at least one meal — checked live on the draft — and no other
 * publish error (as of the last save). Portions given out exactly is advice: the server allows a
 * plan that does not use the whole budget. The message is optional.
 */
export function usePublishChecklist(draft: NutritionDraft, issues: readonly NutritionIssue[], budget: PortionBudget, floorKcal: number) {
  return useMemo(() => {
    const { kcal, confirmBelowFloor } = draft.target;
    const targetOk = kcal !== undefined && (kcal >= floorKcal || confirmBelowFloor);
    const otherErrors = issues.filter((issue) => issue.severity === 'error' && !OWN_CODES.has(issue.code));
    const items: ChecklistItem[] = [
      { id: 'target', section: 'target', state: targetOk ? 'ok' : 'todo' },
      { id: 'meals', section: 'meals', state: draft.meals.length > 0 ? 'ok' : 'todo' },
      { id: 'issues', section: 'meals', state: otherErrors.length === 0 ? 'ok' : 'todo' },
      { id: 'portions', section: 'meals', state: budget.state === 'exact' ? 'ok' : 'advice' },
      { id: 'message', section: 'message', state: draft.introMessage.trim() ? 'ok' : 'optional' },
    ];
    const blockers = items.filter((item) => item.state === 'todo');
    return { items, blockers: blockers.length, firstBlocker: blockers[0] ?? null };
  }, [draft.target, draft.meals.length, draft.introMessage, issues, budget.state, floorKcal]);
}
