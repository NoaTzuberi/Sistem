import type { AiRecommendationInputSummary, AiTrainingPlanDraft } from '@sistem/types';
import { getExerciseFactsByIds } from '../../exercises/exercise.service';
import { retrieveRelevantKnowledge } from '../../knowledge/knowledge.service';
import type { RetrievedKnowledgeChunk } from '../../knowledge/knowledge.service';
import { OnboardingResponse } from '../../onboarding/onboardingResponse.model';
import { RECOMMENDATION_ERROR } from '../aiRecommendation.constants';
import type { RecommendationKind } from '../aiRecommendation.kind';
import { DEFAULT_TRAINING_DAYS, KNOWLEDGE_TOP_K, MIN_CANDIDATES } from './trainingPlan.constants';
import { accessForProfile, coachUsedFamilyIds, loadFamilyPool, selectFamilyCandidates } from './trainingPlanCandidates';
import { buildSplitMenu, neededPatterns } from './trainingPlanSplits';
import type { SplitMenu } from './trainingPlanPrompt';
import { getEffectiveTrainingConfig } from '../../trainingSplits/trainingSplit.service';
import { buildKnowledgeQuery, buildTraineeProfile } from './trainingPlanProfile';
import { TRAINING_PLAN_PROMPT_VERSION, buildTrainingPlanSchema, buildTrainingPlanSystemPrompt, buildTrainingPlanUserMessage } from './trainingPlanPrompt';
import { getUserLanguage } from '../../users/userLanguage';
import { validateTrainingPlanReply } from './trainingPlanValidation';
import type { StoredTrainingPlan, TrainingPlanValidationContext } from './trainingPlanValidation';
import { msg } from '../../../i18n';

/** Optional numbers come back from MongoDB as null (a Mixed field stores undefined as null). */
function optional<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

// PRD §8: a draft weekly plan from her onboarding answers, grounded in the exercise
// library (candidates chosen in code) and the training knowledge base (RAG).

async function retrieveGuidance(query: string): Promise<{ chunks: RetrievedKnowledgeChunk[]; note?: string }> {
  try {
    const chunks = await retrieveRelevantKnowledge(query, KNOWLEDGE_TOP_K);
    return chunks.length > 0 ? { chunks } : { chunks, note: 'The training knowledge base is empty (run seed:knowledge).' };
  } catch (error) {
    // The draft is still useful without the passages; the coach sees that they were missing.
    const reason = error instanceof Error ? error.message : 'unknown error';
    console.warn('[aiRecommendations] knowledge retrieval failed:', reason);
    return { chunks: [], note: 'The training knowledge passages could not be retrieved.' };
  }
}

export const trainingPlanKind: RecommendationKind<TrainingPlanValidationContext, StoredTrainingPlan> = {
  type: 'training_plan',

  async prepare({ traineeId, coachId, request }, now) {
    const response = await OnboardingResponse.findOne({ userId: traineeId }).select('answers').lean();
    if (!response) {
      return { ok: false, code: RECOMMENDATION_ERROR.notEnoughData, message: msg('ai_no_onboarding'), input: null };
    }

    const profile = buildTraineeProfile(response.answers, now);
    const config = await getEffectiveTrainingConfig(coachId);
    const range = profile.trainingDays ?? DEFAULT_TRAINING_DAYS;
    const menu = buildSplitMenu(config, range, request?.splitId);
    if (!menu.ok) {
      return {
        ok: false,
        code: RECOMMENDATION_ERROR.notEnoughData,
        message: menu.message,
        input: {
          profile,
          guidanceSources: [],
          candidateCount: 0,
          promptVersion: TRAINING_PLAN_PROMPT_VERSION,
          ...(request?.splitId ? { requestedSplitId: request.splitId } : {}),
        },
      };
    }

    const [pool, coachUsed, guidance] = await Promise.all([
      loadFamilyPool(accessForProfile(profile)),
      coachUsedFamilyIds(coachId),
      retrieveGuidance(buildKnowledgeQuery(profile)),
    ]);
    const candidates = selectFamilyCandidates(pool, neededPatterns(config, menu.value), profile, coachUsed);

    const input: AiRecommendationInputSummary & { candidates: { alias: string; familyId: string; name: string; variants: string[] }[]; splitMenu: SplitMenu } = {
      profile,
      guidanceSources: guidance.chunks.map((chunk) => chunk.source),
      guidanceNote: guidance.note,
      candidateCount: candidates.length,
      promptVersion: TRAINING_PLAN_PROMPT_VERSION,
      ...(request?.splitId ? { requestedSplitId: request.splitId } : {}),
      splitMenu: menu.value,
      candidates: candidates.map(({ alias, familyId, name, variants }) => ({ alias, familyId, name, variants: variants.map((v) => v.variant) })),
    };

    if (candidates.length < MIN_CANDIDATES) {
      return {
        ok: false,
        code: RECOMMENDATION_ERROR.notEnoughData,
        message: msg('ai_too_few_exercises', { count: candidates.length }),
        input,
      };
    }

    return {
      ok: true,
      promptVersion: TRAINING_PLAN_PROMPT_VERSION,
      system: buildTrainingPlanSystemPrompt(await getUserLanguage(coachId)),
      userMessage: buildTrainingPlanUserMessage(profile, guidance.chunks, candidates, config, menu.value),
      schema: buildTrainingPlanSchema(config),
      input,
      context: { candidates, config, menu: menu.value },
    };
  },

  validate: validateTrainingPlanReply,

  // The candidate list is long and only useful for debugging: kept in the database.
  presentInput(input): AiRecommendationInputSummary {
    const stored = input as unknown as AiRecommendationInputSummary;
    return {
      profile: stored.profile,
      guidanceSources: stored.guidanceSources,
      guidanceNote: stored.guidanceNote,
      candidateCount: stored.candidateCount,
      promptVersion: stored.promptVersion,
      ...(stored.requestedSplitId ? { requestedSplitId: stored.requestedSplitId } : {}),
    };
  },

  async present(output): Promise<AiTrainingPlanDraft> {
    const ids = output.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId));
    const facts = await getExerciseFactsByIds([...new Set(ids)]);
    return {
      ...output,
      workouts: output.workouts.map((workout) => ({
        ...workout,
        dayOfWeek: optional(workout.dayOfWeek),
        workoutType: optional(workout.workoutType),
        exercises: workout.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exercise: facts.get(exercise.exerciseId),
          slotId: optional(exercise.slotId),
          familyId: optional(exercise.familyId),
          variant: optional(exercise.variant),
          sets: exercise.sets,
          reps: optional(exercise.reps),
          repsMax: optional(exercise.repsMax),
          durationSec: optional(exercise.durationSec),
          restSec: optional(exercise.restSec),
          supersetGroup: optional(exercise.supersetGroup),
          why: exercise.why,
        })),
      })),
    };
  },
};
