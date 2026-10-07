import type { AiRecommendationInputSummary, AiTrainingPlanDraft } from '@sistem/types';
import { getExerciseFactsByIds } from '../../exercises/exercise.service';
import { retrieveRelevantKnowledge } from '../../knowledge/knowledge.service';
import type { RetrievedKnowledgeChunk } from '../../knowledge/knowledge.service';
import { OnboardingResponse } from '../../onboarding/onboardingResponse.model';
import { RECOMMENDATION_ERROR } from '../aiRecommendation.constants';
import type { RecommendationKind } from '../aiRecommendation.kind';
import { KNOWLEDGE_TOP_K, MIN_CANDIDATES } from './trainingPlan.constants';
import { loadCandidates } from './trainingPlanCandidates';
import { buildKnowledgeQuery, buildTraineeProfile } from './trainingPlanProfile';
import { TRAINING_PLAN_PROMPT_VERSION, TRAINING_PLAN_SYSTEM_PROMPT, buildTrainingPlanSchema, buildTrainingPlanUserMessage } from './trainingPlanPrompt';
import { validateTrainingPlanReply } from './trainingPlanValidation';
import type { StoredTrainingPlan, TrainingPlanValidationContext } from './trainingPlanValidation';

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

  async prepare({ traineeId, coachId }, now) {
    const response = await OnboardingResponse.findOne({ userId: traineeId }).select('answers').lean();
    if (!response) {
      return { ok: false, code: RECOMMENDATION_ERROR.notEnoughData, message: 'She has no onboarding answers yet.', input: null };
    }

    const profile = buildTraineeProfile(response.answers, now);
    const [candidates, guidance] = await Promise.all([loadCandidates(profile, coachId), retrieveGuidance(buildKnowledgeQuery(profile))]);

    const input: AiRecommendationInputSummary & { candidates: { alias: string; exerciseId: string; name: string }[] } = {
      profile,
      guidanceSources: guidance.chunks.map((chunk) => chunk.source),
      guidanceNote: guidance.note,
      candidateCount: candidates.length,
      promptVersion: TRAINING_PLAN_PROMPT_VERSION,
      candidates: candidates.map(({ alias, facts }) => ({ alias, exerciseId: facts.id, name: facts.name })),
    };

    if (candidates.length < MIN_CANDIDATES) {
      return {
        ok: false,
        code: RECOMMENDATION_ERROR.notEnoughData,
        message: `Only ${candidates.length} library exercises fit her equipment — too few for a draft. Build this plan by hand.`,
        input,
      };
    }

    return {
      ok: true,
      promptVersion: TRAINING_PLAN_PROMPT_VERSION,
      system: TRAINING_PLAN_SYSTEM_PROMPT,
      userMessage: buildTrainingPlanUserMessage(profile, guidance.chunks, candidates),
      schema: buildTrainingPlanSchema(),
      input,
      context: { candidates, trainingDays: profile.trainingDays },
    };
  },

  validate: validateTrainingPlanReply,

  async present(output): Promise<AiTrainingPlanDraft> {
    const ids = output.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId));
    const facts = await getExerciseFactsByIds([...new Set(ids)]);
    return {
      ...output,
      workouts: output.workouts.map((workout) => ({
        ...workout,
        dayOfWeek: optional(workout.dayOfWeek),
        exercises: workout.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exercise: facts.get(exercise.exerciseId),
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
