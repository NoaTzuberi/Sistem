import type { Types } from 'mongoose';
import type {
  AiRecommendation as PublicAiRecommendation,
  AiRecommendationTrigger,
  AiRecommendationType,
} from '@sistem/types';
import { aiClient } from '../ai/ai.client';
import { AI_CONFIG } from '../ai/ai.config';
import { AiProviderError } from '../ai/ai.types';
import type { AiMessage } from '../ai/ai.types';
import { RECOMMENDATION_ERROR } from './aiRecommendation.constants';
import type { RecommendationKind } from './aiRecommendation.kind';
import { AiRecommendation } from './aiRecommendation.model';
import type { AiRecommendationDocument, RecommendationAttempt } from './aiRecommendation.types';
import { nutritionPlanKind } from './nutritionPlan/nutritionPlan.kind';
import { trainingPlanKind } from './trainingPlan/trainingPlan.kind';

// The generic pipeline (PRD §8): prepare the request → ask the model for structured JSON →
// validate in code → send the issues back and retry → store ready / failed. It runs in
// the background inside the server process; nothing here is ever sent to a trainee.

type AnyKind = RecommendationKind<unknown, unknown>;

const KINDS: Record<AiRecommendationType, AnyKind> = {
  training_plan: trainingPlanKind as AnyKind,
  nutrition_plan: nutritionPlanKind as AnyKind,
};

type LeanRecommendation = AiRecommendationDocument & { _id: Types.ObjectId };

const DUPLICATE_KEY_ERROR = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR;
}

export interface StartRecommendationInput {
  traineeId: string;
  coachId: string;
  type: AiRecommendationType;
  trigger: AiRecommendationTrigger;
}

export interface StartedRecommendation {
  recommendation: LeanRecommendation;
  /** false when one was already pending / running (that one is returned). */
  created: boolean;
  /** The background run — awaited only by tests and scripts. */
  run: Promise<void> | null;
}

/** Creates a pending recommendation and runs it in the background. One active run per trainee + type. */
export async function startRecommendation(input: StartRecommendationInput): Promise<StartedRecommendation> {
  // Two tries: the active run can finish between the duplicate-key refusal and the lookup.
  for (let attempt = 1; ; attempt += 1) {
    try {
      const created = await AiRecommendation.create({ ...input, status: 'pending', active: true });
      const id = String(created._id);
      const run = new Promise<void>((resolve) => setImmediate(resolve)).then(() => runRecommendation(id));
      return { recommendation: created.toObject() as LeanRecommendation, created: true, run };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const existing = await AiRecommendation.findOne({ traineeId: input.traineeId, type: input.type, active: true }).lean<LeanRecommendation>();
      if (existing) return { recommendation: existing, created: false, run: null };
      if (attempt >= 2) throw error;
    }
  }
}

function retryMessage(issues: string[]): string {
  return [
    'Your draft broke these rules. Send the whole corrected plan again as JSON, changing only what is needed:',
    ...issues.map((issue) => `- ${issue}`),
  ].join('\n');
}

async function finish(
  id: string,
  update: { status: 'ready' | 'failed'; output?: unknown; model?: string | null; error?: { code: string; message: string } },
): Promise<void> {
  await AiRecommendation.updateOne(
    { _id: id },
    {
      $set: {
        status: update.status,
        active: false,
        output: update.output ?? null,
        ...(update.model !== undefined ? { model: update.model } : {}),
        error: update.error ?? null,
        completedAt: new Date(),
      },
    },
  );
}

async function recordAttempt(id: string, attempt: RecommendationAttempt): Promise<void> {
  await AiRecommendation.updateOne({ _id: id }, { $push: { attempts: attempt } });
}

/** Runs one pending recommendation to ready / failed. Never throws. */
export async function runRecommendation(id: string): Promise<void> {
  const claimed = await AiRecommendation.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { status: 'running', startedAt: new Date() } },
    { returnDocument: 'after' },
  ).lean<LeanRecommendation>();
  if (!claimed) return;

  try {
    const kind = KINDS[claimed.type];
    const prepared = await kind.prepare({ traineeId: String(claimed.traineeId), coachId: String(claimed.coachId) }, new Date());
    await AiRecommendation.updateOne(
      { _id: id },
      { $set: { input: prepared.input, promptVersion: prepared.ok ? prepared.promptVersion : null } },
    );
    if (!prepared.ok) {
      await finish(id, { status: 'failed', error: { code: prepared.code, message: prepared.message } });
      return;
    }

    const messages: AiMessage[] = [{ role: 'user', text: prepared.userMessage }];
    let lastIssues: string[] = [];
    let lastModel: string | null = null;

    for (let attemptNumber = 1; attemptNumber <= AI_CONFIG.maxAttempts; attemptNumber += 1) {
      const startedAt = new Date();
      let reply;
      try {
        // A copy: the conversation grows after this call, the request that was sent must not.
        reply = await aiClient.generateJson({ system: prepared.system, messages: [...messages], schema: prepared.schema });
      } catch (error) {
        if (!(error instanceof AiProviderError)) throw error;
        await recordAttempt(id, {
          startedAt,
          finishedAt: new Date(),
          model: error.model,
          finish: null,
          inputTokens: 0,
          outputTokens: 0,
          thinkingTokens: 0,
          issues: [],
          error: `${error.code}: ${error.message}`,
          fallbackReason: null,
        });
        await finish(id, { status: 'failed', model: error.model ?? lastModel, error: { code: error.code, message: error.message } });
        return;
      }

      lastModel = reply.model;
      let issues: string[];
      let output: unknown = null;
      if (reply.finish === 'max_tokens') {
        issues = ['The reply was cut off before the end. Keep every text field short.'];
      } else {
        let parsed: unknown;
        try {
          parsed = JSON.parse(reply.text);
        } catch {
          parsed = undefined;
        }
        if (parsed === undefined) {
          issues = ['The reply was not valid JSON.'];
        } else {
          const result = await kind.validate(parsed, prepared.context);
          issues = result.issues;
          output = result.value;
        }
      }

      await recordAttempt(id, {
        startedAt,
        finishedAt: new Date(),
        model: reply.model,
        finish: reply.finish,
        inputTokens: reply.usage.inputTokens,
        outputTokens: reply.usage.outputTokens,
        thinkingTokens: reply.usage.thinkingTokens,
        issues,
        error: null,
        fallbackReason: reply.fallbackReason ?? null,
      });

      if (issues.length === 0) {
        await finish(id, { status: 'ready', output, model: reply.model });
        return;
      }
      lastIssues = issues;
      messages.push({ role: 'model', text: reply.text }, { role: 'user', text: retryMessage(issues) });
    }

    await finish(id, {
      status: 'failed',
      model: lastModel,
      error: {
        code: RECOMMENDATION_ERROR.invalidOutput,
        message: `The AI draft broke the rules ${AI_CONFIG.maxAttempts} times. Last problems: ${lastIssues.slice(0, 3).join(' ')}`,
      },
    });
  } catch (error) {
    console.error(`[aiRecommendations] ${id} failed:`, error);
    await finish(id, { status: 'failed', error: { code: RECOMMENDATION_ERROR.internal, message: 'Something went wrong while generating the draft.' } }).catch(
      (finishError: unknown) => console.error(`[aiRecommendations] ${id} could not be marked failed:`, finishError),
    );
  }
}

/**
 * At server start: runs live inside the server process, so anything still pending /
 * running belongs to a process that is gone (one server instance for now).
 */
export async function failInterruptedRecommendations(): Promise<number> {
  const result = await AiRecommendation.updateMany(
    { active: true },
    {
      $set: {
        status: 'failed',
        active: false,
        completedAt: new Date(),
        error: { code: RECOMMENDATION_ERROR.interrupted, message: 'The server restarted while the draft was being generated.' },
      },
    },
  );
  return result.modifiedCount;
}

// --- Reading (coach) ----------------------------------------------------------

async function toPublicRecommendation(doc: LeanRecommendation): Promise<PublicAiRecommendation> {
  const kind = KINDS[doc.type];
  const target = { traineeId: String(doc.traineeId), coachId: String(doc.coachId) };
  // The input / output shapes belong to the type (the kinds build them).
  return {
    id: String(doc._id),
    traineeId: String(doc.traineeId),
    type: doc.type,
    status: doc.status,
    trigger: doc.trigger,
    createdAt: doc.createdAt.toISOString(),
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    model: doc.model,
    attemptCount: doc.attempts.length,
    error: doc.error ? { code: doc.error.code, message: doc.error.message } : null,
    input: doc.input ? kind.presentInput(doc.input) : null,
    output: doc.status === 'ready' && doc.output ? await kind.present(doc.output, target) : null,
  } as PublicAiRecommendation;
}

export async function getLatestRecommendation(traineeId: string, type: AiRecommendationType): Promise<PublicAiRecommendation | null> {
  const doc = await AiRecommendation.findOne({ traineeId, type }).sort({ createdAt: -1, _id: -1 }).lean<LeanRecommendation>();
  return doc ? toPublicRecommendation(doc) : null;
}

export async function getRecommendation(traineeId: string, id: string): Promise<PublicAiRecommendation | null> {
  const doc = await AiRecommendation.findOne({ _id: id, traineeId }).lean<LeanRecommendation>();
  return doc ? toPublicRecommendation(doc) : null;
}

export async function presentRecommendation(doc: LeanRecommendation): Promise<PublicAiRecommendation> {
  return toPublicRecommendation(doc);
}

/** For the plan saves: a ready recommendation of this trainee (and type) that a plan may point at. */
export async function isLinkableRecommendation(
  traineeId: string,
  id: string,
  type: AiRecommendationType = 'training_plan',
): Promise<boolean> {
  return (await AiRecommendation.exists({ _id: id, traineeId, type, status: 'ready' })) !== null;
}
