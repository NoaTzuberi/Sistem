import { config } from '../../config/env';
import { AI_CONFIG } from './ai.config';
import { AiProviderError } from './ai.types';
import type { AiJsonRequest, AiJsonResponse } from './ai.types';

// Google Gemini over its REST API (generateContent + responseJsonSchema) with plain
// fetch, like the Voyage embeddings — no SDK. Only ai.client.ts imports this file.

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Overridable in tests so backoff never really waits. */
export const geminiTiming = {
  sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  modelVersion?: string;
}

interface GeminiErrorDetail {
  '@type'?: string;
  retryDelay?: string;
  violations?: { quotaId?: string }[];
}

interface GeminiErrorBody {
  error?: { code?: number; message?: string; status?: string; details?: GeminiErrorDetail[] };
}

/** One failed call, and whether trying the same model again could help. */
class CallFailure extends AiProviderError {
  constructor(
    code: AiProviderError['code'],
    message: string,
    model: string,
    public readonly retryable: boolean,
    public readonly retryAfterMs: number | null = null,
  ) {
    super(code, message, model);
  }
}

function parseDelayMs(value: string | undefined): number | null {
  const match = value?.match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Math.ceil(Number(match[1]) * 1000) : null;
}

function toCallFailure(status: number, body: GeminiErrorBody, model: string): CallFailure {
  const message = body.error?.message?.slice(0, 300) || `Gemini request failed (${status}).`;
  const details = body.error?.details ?? [];

  if (status === 429) {
    const quotaIds = details.flatMap((detail) => detail.violations ?? []).map((violation) => violation.quotaId ?? '');
    // A daily free-tier quota won't come back by waiting a few seconds.
    if (quotaIds.some((id) => /PerDay/i.test(id))) {
      return new CallFailure('quota_exhausted', message, model, false);
    }
    const retryAfterMs = details.map((detail) => parseDelayMs(detail.retryDelay)).find((delay) => delay !== null) ?? null;
    return new CallFailure('rate_limited', message, model, true, retryAfterMs);
  }
  if (status === 401 || status === 403) return new CallFailure('auth', message, model, false);
  if (status >= 500) return new CallFailure('unavailable', message, model, true);
  return new CallFailure('bad_request', message, model, false);
}

async function callOnce(model: string, request: AiJsonRequest): Promise<AiJsonResponse> {
  let response: Response;
  try {
    response = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.ai.geminiApiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.system }] },
        contents: request.messages.map((message) => ({ role: message.role, parts: [{ text: message.text }] })),
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: request.schema,
          maxOutputTokens: AI_CONFIG.maxOutputTokens,
          thinkingConfig: { thinkingLevel: AI_CONFIG.thinkingLevel },
        },
      }),
      signal: AbortSignal.timeout(AI_CONFIG.requestTimeoutMs),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    throw new CallFailure('network', `Could not reach Gemini: ${reason}`, model, true);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as GeminiErrorBody;
    throw toCallFailure(response.status, body, model);
  }

  const body = (await response.json()) as GeminiResponse;
  const blockReason = body.promptFeedback?.blockReason;
  if (blockReason) {
    throw new CallFailure('declined', `Gemini declined the request (${blockReason}).`, model, false);
  }

  const candidate = body.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
  const finishReason = candidate?.finishReason ?? 'FINISH_REASON_UNSPECIFIED';
  const usage = {
    inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
    thinkingTokens: body.usageMetadata?.thoughtsTokenCount ?? 0,
  };
  const servedBy = body.modelVersion ?? model;

  if (finishReason === 'MAX_TOKENS') return { text, model: servedBy, finish: 'max_tokens', usage };
  if (finishReason !== 'STOP' || !text) {
    throw new CallFailure('declined', `Gemini stopped without a reply (${finishReason}).`, model, false);
  }
  return { text, model: servedBy, finish: 'stop', usage };
}

function backoffMs(retry: number, retryAfterMs: number | null): number {
  const exponential = AI_CONFIG.backoffBaseMs * 2 ** retry + Math.floor(Math.random() * 250);
  return Math.min(AI_CONFIG.backoffMaxMs, retryAfterMs ?? exponential);
}

/** One model, with backoff on 429 (per minute), 5xx and network errors. */
async function callWithRetries(model: string, request: AiJsonRequest): Promise<AiJsonResponse> {
  for (let retry = 0; ; retry += 1) {
    try {
      return await callOnce(model, request);
    } catch (error) {
      if (!(error instanceof CallFailure) || !error.retryable || retry >= AI_CONFIG.maxProviderRetries) throw error;
      // Asked to wait longer than we ever would: give the fallback model its turn instead.
      if (error.retryAfterMs !== null && error.retryAfterMs > AI_CONFIG.backoffMaxMs) throw error;
      await geminiTiming.sleep(backoffMs(retry, error.retryAfterMs));
    }
  }
}

/**
 * The main model, then the fallback model on anything but an auth error (a wrong key
 * is wrong for both). The error carries the last code and every model's reason.
 */
export async function generateGeminiJson(request: AiJsonRequest): Promise<AiJsonResponse> {
  const models = [AI_CONFIG.model, AI_CONFIG.fallbackModel].filter(
    (model, index, list): model is string => Boolean(model) && list.indexOf(model) === index,
  );

  const failures: AiProviderError[] = [];
  for (const model of models) {
    try {
      const reply = await callWithRetries(model, request);
      if (failures.length === 0) return reply;
      return { ...reply, fallbackReason: failures.map((failure) => `${failure.model}: ${failure.code}: ${failure.message}`).join(' | ') };
    } catch (error) {
      if (!(error instanceof AiProviderError)) throw error;
      failures.push(error);
      if (error.code === 'auth') break;
      console.warn(`[ai] ${model} failed (${error.code}); ${models.length > failures.length ? 'trying the fallback model' : 'no model left'}.`);
    }
  }
  const last = failures[failures.length - 1];
  const message = failures.length > 1 ? failures.map((failure) => `${failure.model}: ${failure.message}`).join(' | ') : last.message;
  throw new AiProviderError(last.code, message, last.model);
}
