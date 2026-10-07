import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config } from '../../../config/env';
import { AI_CONFIG } from '../ai.config';
import { aiClient } from '../ai.client';
import { AiProviderError } from '../ai.types';
import { generateGeminiJson, geminiTiming } from '../gemini.provider';

// Phase 12: the Gemini provider behind ai.client.ts — free-tier 429 backoff, the
// fallback model, declines and cut-off replies. fetch is faked; nothing leaves the test.

const REQUEST = { system: 'sys', messages: [{ role: 'user' as const, text: 'hi' }], schema: { type: 'object' } };

function ok(parts: { text: string; thought?: boolean }[], finishReason = 'STOP', modelVersion?: string) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts }, finishReason }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 7 },
      modelVersion,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function error(status: number, details: unknown[] = [], message = 'nope') {
  return new Response(JSON.stringify({ error: { code: status, message, details } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const perMinute = [
  { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }] },
  { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3s' },
];
const perDay = [
  { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] },
  { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '20s' },
];

let fetchMock: ReturnType<typeof vi.fn>;
let sleeps: number[];

function modelsCalled(): string[] {
  return fetchMock.mock.calls.map(([url]) => String(url).match(/models\/([^:]+):/)?.[1] ?? '?');
}

describe('gemini provider', () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    sleeps = [];
    vi.spyOn(geminiTiming, 'sleep').mockImplementation(async (ms: number) => {
      sleeps.push(ms);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the schema as structured output and returns the reply without thought parts', async () => {
    fetchMock.mockResolvedValueOnce(ok([{ text: 'thinking…', thought: true }, { text: '{"a":1}' }], 'STOP', 'gemini-x-001'));

    const reply = await generateGeminiJson(REQUEST);

    expect(reply).toStrictEqual({
      text: '{"a":1}',
      model: 'gemini-x-001',
      finish: 'stop',
      usage: { inputTokens: 10, outputTokens: 5, thinkingTokens: 7 },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain(`/models/${AI_CONFIG.model}:generateContent`);
    const body = JSON.parse(init.body);
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } });
    expect(body.systemInstruction.parts[0].text).toBe('sys');
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'hi' }] }]);
    // The key travels in a header, never in the URL.
    expect(String(url)).not.toContain('key=');
  });

  it('waits the asked delay on a per-minute 429, then succeeds on the same model', async () => {
    fetchMock.mockResolvedValueOnce(error(429, perMinute)).mockResolvedValueOnce(ok([{ text: '{}' }]));

    await generateGeminiJson(REQUEST);

    expect(sleeps).toEqual([3000]);
    expect(modelsCalled()).toEqual([AI_CONFIG.model, AI_CONFIG.model]);
  });

  it('backs off exponentially on 503, then moves to the fallback model', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes(AI_CONFIG.model) ? error(503) : ok([{ text: '{}' }], 'STOP', 'fallback-001'),
    );

    const reply = await generateGeminiJson(REQUEST);

    expect(reply.model).toBe('fallback-001');
    expect(reply.fallbackReason).toContain(`${AI_CONFIG.model}: unavailable`);
    expect(modelsCalled()).toEqual([...Array(AI_CONFIG.maxProviderRetries + 1).fill(AI_CONFIG.model), AI_CONFIG.fallbackModel]);
    expect(sleeps).toHaveLength(AI_CONFIG.maxProviderRetries);
    expect(sleeps[1]).toBeGreaterThan(sleeps[0]);
  });

  it('does not wait out a daily quota: goes straight to the fallback model', async () => {
    fetchMock.mockResolvedValueOnce(error(429, perDay)).mockResolvedValueOnce(ok([{ text: '{}' }]));

    await generateGeminiJson(REQUEST);

    expect(sleeps).toEqual([]);
    expect(modelsCalled()).toEqual([AI_CONFIG.model, AI_CONFIG.fallbackModel]);
  });

  it('tries the fallback when the main model declines', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }), { status: 200 }))
      .mockResolvedValueOnce(ok([{ text: '{}' }]));

    await generateGeminiJson(REQUEST);
    expect(modelsCalled()).toEqual([AI_CONFIG.model, AI_CONFIG.fallbackModel]);
  });

  it('reports the last failure when both models fail', async () => {
    fetchMock.mockResolvedValueOnce(error(429, perDay)).mockResolvedValueOnce(error(429, perDay, 'daily quota used'));

    await expect(generateGeminiJson(REQUEST)).rejects.toMatchObject({
      code: 'quota_exhausted',
      message: `${AI_CONFIG.model}: nope | ${AI_CONFIG.fallbackModel}: daily quota used`,
      model: AI_CONFIG.fallbackModel,
    });
  });

  it('never retries or falls back on a bad key', async () => {
    fetchMock.mockResolvedValue(error(403));

    await expect(generateGeminiJson(REQUEST)).rejects.toMatchObject({ code: 'auth' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns a cut-off reply as max_tokens (the pipeline retries it)', async () => {
    fetchMock.mockResolvedValueOnce(ok([{ text: '{"summ' }], 'MAX_TOKENS'));

    const reply = await generateGeminiJson(REQUEST);
    expect(reply.finish).toBe('max_tokens');
  });

  it('retries network errors with backoff', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(ok([{ text: '{}' }]));

    await generateGeminiJson(REQUEST);
    expect(sleeps).toHaveLength(1);
  });

  it('ai.client refuses to call any model without a key', async () => {
    const saved = config.ai.geminiApiKey;
    config.ai.geminiApiKey = '';
    try {
      await expect(aiClient.generateJson(REQUEST)).rejects.toBeInstanceOf(AiProviderError);
      await expect(aiClient.generateJson(REQUEST)).rejects.toMatchObject({ code: 'not_configured' });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      config.ai.geminiApiKey = saved;
    }
  });

  it('ai.client refuses to run in production until a paid tier is set', async () => {
    const saved = { key: config.ai.geminiApiKey, env: config.nodeEnv, paid: config.ai.paidTier };
    Object.assign(config, { nodeEnv: 'production' });
    config.ai.geminiApiKey = 'test-key';
    config.ai.paidTier = false;
    try {
      await expect(aiClient.generateJson(REQUEST)).rejects.toMatchObject({ code: 'not_configured' });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      Object.assign(config, { nodeEnv: saved.env });
      config.ai.geminiApiKey = saved.key;
      config.ai.paidTier = saved.paid;
    }
  });
});
