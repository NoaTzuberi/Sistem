import { EventEmitter } from 'node:events';

// Internal domain events. Features announce what happened here; other features
// (notifications since Phase 5a, the AI recommendation in Phase 12) subscribe
// without the emitter knowing about them.

export interface TraineeOnboardedEvent {
  traineeId: string;
  coachId: string | null;
  completedAt: Date;
}

/** Emitted by the publish service (Phase 6) when a plan becomes visible to the trainee. */
export interface PlanPublishedEvent {
  planId: string;
  traineeId: string;
  coachId: string;
  /** 'YYYY-MM-DD' Sunday in the trainee's time zone */
  weekStartDate: string;
  publishedAt: Date;
}

interface AppEventMap {
  'trainee.onboarded': [TraineeOnboardedEvent];
  'plan.published': [PlanPublishedEvent];
}

export type AppEventName = keyof AppEventMap;

export const appEvents = new EventEmitter<AppEventMap>();

/**
 * Emits after the change is saved. A failing listener is logged and never fails
 * the request that caused the event — the data is already stored.
 */
export function emitAppEvent<K extends AppEventName>(name: K, ...args: AppEventMap[K]): void {
  for (const listener of appEvents.listeners(name)) {
    try {
      const result: unknown = (listener as (...a: AppEventMap[K]) => unknown)(...args);
      if (result instanceof Promise) {
        result.catch((error: unknown) => console.error(`[appEvents] ${name} listener failed:`, error));
      }
    } catch (error) {
      console.error(`[appEvents] ${name} listener failed:`, error);
    }
  }
}
