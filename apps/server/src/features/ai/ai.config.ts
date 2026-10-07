import { config } from '../../config/env';

// One place for every AI setting. The provider is Google Gemini (free tier, dev only —
// see PRD §14); switching provider means a new provider file behind ai.client.ts.

export const AI_CONFIG = {
  /** AI_MODEL overrides. Supports structured JSON output (responseJsonSchema). */
  model: config.ai.model || 'gemini-3.8-flash',
  /**
   * Tried when the main model is overloaded, out of its daily free quota, or declines.
   * Free-tier quotas are counted per model, so a second model really is a second chance.
   * AI_FALLBACK_MODEL overrides; 'none' turns the fallback off.
   */
  fallbackModel: config.ai.fallbackModel === 'none' ? null : config.ai.fallbackModel || 'gemini-3.5-flash-lite',
  thinkingLevel: 'medium' as 'low' | 'medium' | 'high',
  maxOutputTokens: 32_768,
  requestTimeoutMs: 180_000,
  /** Provider retries per model for 429 (per minute) / 5xx / network errors, with backoff. */
  maxProviderRetries: 3,
  backoffBaseMs: 2_000,
  backoffMaxMs: 60_000,
  /** Model attempts per recommendation: the first + retries that send back the issues. */
  maxAttempts: 3,
  /** A recommendation still running after this long is treated as interrupted. */
  staleAfterMs: 10 * 60 * 1000,
} as const;

/** Why the AI can't run on this server, or null when it can. */
export function aiUnavailableReason(): string | null {
  if (!config.ai.geminiApiKey) return 'AI drafts are not set up on this server (no GEMINI_API_KEY).';
  if (config.nodeEnv === 'production' && !config.ai.paidTier) {
    return 'AI drafts are off in production until a paid AI tier that excludes training on our data is set up.';
  }
  return null;
}
