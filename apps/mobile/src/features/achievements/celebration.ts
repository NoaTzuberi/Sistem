import { useSyncExternalStore } from 'react';
import type { Achievement } from '@sistem/types';
import { markAchievementsSeen } from '../../services/achievements/achievementsService';

// One celebration queue for the whole app: a body save, Home (anything not celebrated
// yet) and the workout summary all hand unlocks here; AchievementCelebration (mounted
// once) shows them and tells the server they were seen, so each one is celebrated once.
let queue: Achievement[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

/** Queues the unseen ones; one already queued is not added twice. */
export function celebrate(achievements: Achievement[] | undefined): void {
  const fresh = (achievements ?? []).filter((achievement) => !achievement.seen && !queue.some((queued) => queued.id === achievement.id));
  if (fresh.length === 0) return;
  queue = [...queue, ...fresh];
  emit();
}

/** Seen on the server; a failure only means it may be celebrated once more later. */
export async function markSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await markAchievementsSeen(ids);
  } catch {
    // Not worth bothering her: the next celebration retries.
  }
}

/** The celebration was closed: everything shown is seen. */
export function finishCelebration(): void {
  const shown = queue.map((achievement) => achievement.id);
  queue = [];
  emit();
  void markSeen(shown);
}

export function useCelebrationQueue(): Achievement[] {
  return useSyncExternalStore(subscribe, () => queue);
}
