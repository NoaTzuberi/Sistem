// Provider-neutral shapes: the recommendation pipeline only ever sees these.

export interface AiMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AiJsonRequest {
  system: string;
  messages: AiMessage[];
  /** JSON Schema the reply must follow (objects closed with additionalProperties: false). */
  schema: Record<string, unknown>;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
}

export interface AiJsonResponse {
  /** The raw JSON text of the reply. */
  text: string;
  model: string;
  /** 'stop' when the reply is complete; 'max_tokens' when it was cut off. */
  finish: 'stop' | 'max_tokens';
  usage: AiUsage;
  /** Set when the reply came from the fallback model: why the main model(s) failed. */
  fallbackReason?: string;
}

export type AiErrorCode =
  | 'not_configured'
  | 'rate_limited'
  | 'quota_exhausted'
  | 'unavailable'
  | 'declined'
  | 'bad_request'
  | 'auth'
  | 'network';

/** The provider could not produce a reply (after its own retries and fallback). */
export class AiProviderError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly model: string | null = null,
  ) {
    super(message);
  }
}
