import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  AchievementOverview,
  BodyMetricList,
  CoachPlan,
  CoachTraineeList,
  CoachTraineeResponse,
  CreatePlanPayload,
  ExerciseSearchParams,
  ExerciseSearchResult,
  PlanIssue,
  PlanWeekOptions,
  SavePlanPayload,
  WorkoutLog,
} from '@sistem/types';
import { extractErrorMessage } from './createApiClient';

/**
 * A failed plan call. `issues` is filled when the server refused the plan's content
 * and says which workout / exercise each problem belongs to.
 */
export class PlanRequestError extends Error {
  readonly issues: PlanIssue[];

  constructor(message: string, issues: PlanIssue[] = []) {
    super(message);
    this.issues = issues;
  }
}

function toPlanRequestError(error: unknown, fallback: string): PlanRequestError {
  const issues: unknown = axios.isAxiosError(error) ? error.response?.data?.issues : undefined;
  return new PlanRequestError(extractErrorMessage(error, fallback), Array.isArray(issues) ? (issues as PlanIssue[]) : []);
}

// The human Coach's calls (/api/coach), shared by the web dashboard and the coach
// mode of the mobile app. The server checks role=coach and trainee ownership on each.
export function createCoachApi(client: AxiosInstance) {
  const plansPath = (traineeId: string) => `/coach/trainees/${traineeId}/plans`;

  async function listTrainees(): Promise<CoachTraineeList> {
    const { data } = await client.get<CoachTraineeList>('/coach/trainees');
    return data;
  }

  async function getTrainee(traineeId: string): Promise<CoachTraineeResponse> {
    const { data } = await client.get<CoachTraineeResponse>(`/coach/trainees/${traineeId}`);
    return data;
  }

  async function listTraineeWorkoutLogs(traineeId: string): Promise<WorkoutLog[]> {
    const { data } = await client.get<{ items: WorkoutLog[] }>(`/coach/trainees/${traineeId}/workout-logs`);
    return data.items;
  }

  /** Her days (newest first) with signed photo links, and the measurement list. */
  async function listTraineeBodyMetrics(traineeId: string): Promise<BodyMetricList> {
    const { data } = await client.get<BodyMetricList>(`/coach/trainees/${traineeId}/body-metrics`);
    return data;
  }

  /** Her streak and achievements, read-only. */
  async function getTraineeAchievements(traineeId: string): Promise<AchievementOverview> {
    const { data } = await client.get<AchievementOverview>(`/coach/trainees/${traineeId}/achievements`);
    return data;
  }

  async function searchExercises(params: ExerciseSearchParams = {}): Promise<ExerciseSearchResult> {
    const { data } = await client.get<ExerciseSearchResult>('/coach/exercises', { params });
    return data;
  }

  async function listPlans(traineeId: string): Promise<CoachPlan[]> {
    const { data } = await client.get<{ items: CoachPlan[] }>(plansPath(traineeId));
    return data.items;
  }

  /** The weeks the picker offers for a new or duplicated plan, with their defaults. */
  async function listPlanWeeks(traineeId: string): Promise<PlanWeekOptions> {
    const { data } = await client.get<PlanWeekOptions>(`/coach/trainees/${traineeId}/plan-weeks`);
    return data;
  }

  async function getPlan(traineeId: string, planId: string): Promise<CoachPlan> {
    const { data } = await client.get<{ plan: CoachPlan }>(`${plansPath(traineeId)}/${planId}`);
    return data.plan;
  }

  async function createPlan(traineeId: string, payload: CreatePlanPayload): Promise<CoachPlan> {
    try {
      const { data } = await client.post<{ plan: CoachPlan }>(plansPath(traineeId), payload);
      return data.plan;
    } catch (error) {
      throw toPlanRequestError(error, "Couldn't create the plan. Please try again.");
    }
  }

  async function savePlan(traineeId: string, planId: string, payload: SavePlanPayload): Promise<CoachPlan> {
    try {
      const { data } = await client.put<{ plan: CoachPlan }>(`${plansPath(traineeId)}/${planId}`, payload);
      return data.plan;
    } catch (error) {
      throw toPlanRequestError(error, "Couldn't save the plan. Please try again.");
    }
  }

  async function publishPlan(traineeId: string, planId: string): Promise<CoachPlan> {
    try {
      const { data } = await client.post<{ plan: CoachPlan }>(`${plansPath(traineeId)}/${planId}/publish`);
      return data.plan;
    } catch (error) {
      throw toPlanRequestError(error, "Couldn't publish the plan. Please try again.");
    }
  }

  async function unpublishPlan(traineeId: string, planId: string): Promise<CoachPlan> {
    try {
      const { data } = await client.post<{ plan: CoachPlan }>(`${plansPath(traineeId)}/${planId}/unpublish`);
      return data.plan;
    } catch (error) {
      throw toPlanRequestError(error, "Couldn't unpublish the plan. Please try again.");
    }
  }

  async function deletePlan(traineeId: string, planId: string): Promise<void> {
    try {
      await client.delete(`${plansPath(traineeId)}/${planId}`);
    } catch (error) {
      throw toPlanRequestError(error, "Couldn't delete the plan. Please try again.");
    }
  }

  return {
    listTrainees,
    getTrainee,
    listTraineeWorkoutLogs,
    listTraineeBodyMetrics,
    getTraineeAchievements,
    searchExercises,
    listPlans,
    listPlanWeeks,
    getPlan,
    createPlan,
    savePlan,
    publishPlan,
    unpublishPlan,
    deletePlan,
  };
}

export type CoachApi = ReturnType<typeof createCoachApi>;
