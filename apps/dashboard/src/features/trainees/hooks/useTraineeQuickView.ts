import { useCallback } from 'react';
import type { AiTrainingPlanDraft, CoachTraineeSummary, CoachTraineeWeek, MyOnboarding } from '@sistem/types';
import { useLoad } from '@sistem/shared';
import { useCoachData } from '../../../services/coach/CoachDataContext';
import { getLatestAiRecommendation, getTrainee, listPlans } from '../../../services/coach/coachService';
import { useWindowCountdown } from './useWindowCountdown';
import type { WindowCountdown } from './useWindowCountdown';

/**
 * The quick view's own reading of her status. `attention` = active, with a workout of this week
 * already skipped (a day passed without it) — the same "missed" the week board shows. `idle` = no
 * plan running: inactive, or not through the questionnaire yet (new).
 */
export type QuickViewStatus = 'waiting' | 'active' | 'attention' | 'idle';

// useLoad wants a message; the quick view simply leaves out what did not load.
const FAILED = 'failed';
const NOTHING = () => Promise.resolve(null);

export interface TraineeQuickView {
  trainee: CoachTraineeSummary;
  week: CoachTraineeWeek | undefined;
  status: QuickViewStatus;
  /** Server time, for "last activity … ago". */
  nowMs: number;
  /** Waiting: the 48h window. */
  window: WindowCountdown | null;
  /** How many plans she has (the list's count), once known. */
  planCount: number | undefined;
  /** Waiting: her answers (the questionnaire snippet), once loaded. */
  onboarding: MyOnboarding | null;
  /** Waiting: a ready AI draft of her first plan, if there is one. */
  aiDraft: AiTrainingPlanDraft | null;
}

/** Everything the quick view shows for one trainee: the shared coach data, plus what only it needs (loaded when opened). */
export function useTraineeQuickView(trainee: CoachTraineeSummary): TraineeQuickView {
  const { weekOf, nowMs } = useCoachData();
  const week = weekOf(trainee.id);
  const plan = week?.currentPlan ?? null;
  const missed = plan?.workouts.filter((workout) => workout.status === 'missed').length ?? 0;
  const status: QuickViewStatus =
    trainee.status === 'waiting' ? 'waiting' : trainee.status === 'active' && plan ? (missed > 0 ? 'attention' : 'active') : 'idle';
  const isWaiting = status === 'waiting';

  const planWindow = useWindowCountdown(isWaiting ? trainee.planDueAt : null, nowMs);
  const plansLoad = useLoad(useCallback(() => listPlans(trainee.id), [trainee.id]), FAILED);
  // Only a waiting trainee shows her answers and an AI draft — nothing is asked for otherwise.
  const detailLoad = useLoad(useCallback(() => (isWaiting ? getTrainee(trainee.id) : NOTHING()), [trainee.id, isWaiting]), FAILED);
  const aiLoad = useLoad(useCallback(() => (isWaiting ? getLatestAiRecommendation(trainee.id) : NOTHING()), [trainee.id, isWaiting]), FAILED);
  const latestAi = aiLoad.data?.recommendation ?? null;

  return {
    trainee,
    week,
    status,
    nowMs,
    window: planWindow,
    planCount: plansLoad.data?.length,
    onboarding: detailLoad.data?.trainee.onboarding ?? null,
    aiDraft: latestAi?.status === 'ready' && latestAi.output ? latestAi.output : null,
  };
}
