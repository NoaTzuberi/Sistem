import type { AiRecommendationType } from '@sistem/types';

// What one TYPE of recommendation plugs into the generic pipeline
// (prompt → structured output → validation → retry → store). Training plan: Phase 12.
// Nutrition plan: Phase 13c adds a second kind; the runner doesn't change.

export interface RecommendationTarget {
  traineeId: string;
  coachId: string;
}

export type PreparedRecommendation<Context> =
  | {
      ok: true;
      promptVersion: string;
      system: string;
      userMessage: string;
      schema: Record<string, unknown>;
      /** Stored with the recommendation: exactly what was sent (shown to the coach). */
      input: object;
      /** Anything validate() needs (e.g. the alias → exercise map). */
      context: Context;
    }
  | {
      ok: false;
      /** Not enough data to ask the model (e.g. no usable exercises): the coach is told why. */
      code: string;
      message: string;
      input: object | null;
    };

export type KindValidationResult<Output> = { value: Output; issues: [] } | { value: null; issues: string[] };

export interface RecommendationKind<Context, Output> {
  type: AiRecommendationType;
  prepare(target: RecommendationTarget, now: Date): Promise<PreparedRecommendation<Context>>;
  /** Checks the parsed reply in code; issues are sentences sent back to the model. */
  validate(reply: unknown, context: Context): Promise<KindValidationResult<Output>>;
  /** The stored output as the coach's API sends it (e.g. with exercise facts). */
  present(output: Output): Promise<unknown>;
}
