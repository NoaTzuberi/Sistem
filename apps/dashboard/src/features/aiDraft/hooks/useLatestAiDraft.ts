import { useCallback, useEffect, useState } from 'react';
import type { AiRecommendation, AiRecommendationType } from '@sistem/types';
import { useLoad } from '@sistem/shared';
import { generateAiRecommendation, getLatestAiRecommendation } from '../../../services/coach/coachService';
import { AI_DRAFT_COPY, AI_DRAFT_POLL_MS } from '../data/aiDraftCopy';

function isRunning(recommendation: AiRecommendation | null | undefined): boolean {
  return recommendation?.status === 'pending' || recommendation?.status === 'running';
}

/** The trainee's newest AI draft of that type (training plan by default); polls while it is being generated. */
export function useLatestAiDraft<T extends AiRecommendationType = 'training_plan'>(traineeId: string, type: T = 'training_plan' as T) {
  const load = useCallback(() => getLatestAiRecommendation(traineeId, type), [traineeId, type]);
  const { data, error, isLoading, reload } = useLoad(load, AI_DRAFT_COPY.loadError);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string>();

  const latest = data?.recommendation ?? null;
  const running = isRunning(latest);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(reload, AI_DRAFT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [running, reload]);

  const generate = useCallback(async () => {
    setIsStarting(true);
    setStartError(undefined);
    try {
      await generateAiRecommendation(traineeId, type);
      reload();
    } catch (failure) {
      setStartError(failure instanceof Error ? failure.message : AI_DRAFT_COPY.loadError);
    } finally {
      setIsStarting(false);
    }
  }, [traineeId, type, reload]);

  return {
    latest,
    /** The newest draft when it is ready to load. */
    ready: latest?.status === 'ready' && latest.output ? latest : null,
    running,
    unavailableReason: data?.unavailableReason ?? null,
    error,
    // Only the first load shows as loading; polls keep the last answer on screen.
    isLoading: isLoading && !data,
    generate,
    isStarting,
    startError,
  };
}
