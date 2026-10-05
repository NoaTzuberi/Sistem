import type { AxiosInstance } from 'axios';
import type { TraineePlan, TraineePlanList, TraineeWeek, WorkoutLog } from '@sistem/types';

// The trainee's own plans and workout logs (/api/plans, /api/workout-logs). The
// server scopes every call to the signed-in trainee and computes each workout's
// status in her time zone.
export function createTraineeApi(client: AxiosInstance) {
  /** This week's plan, the status of each workout and the workout to start next. */
  async function getWeek(): Promise<TraineeWeek> {
    const { data } = await client.get<TraineeWeek>('/plans/week');
    return data;
  }

  async function listPlans(): Promise<TraineePlanList> {
    const { data } = await client.get<TraineePlanList>('/plans');
    return data;
  }

  async function getPlan(planId: string): Promise<TraineePlan> {
    const { data } = await client.get<{ plan: TraineePlan }>(`/plans/${planId}`);
    return data.plan;
  }

  async function listWorkoutLogs(): Promise<WorkoutLog[]> {
    const { data } = await client.get<{ items: WorkoutLog[] }>('/workout-logs');
    return data.items;
  }

  /** One log, with the names of its exercises. */
  async function getWorkoutLog(logId: string): Promise<WorkoutLog> {
    const { data } = await client.get<{ log: WorkoutLog }>(`/workout-logs/${logId}`);
    return data.log;
  }

  return { getWeek, listPlans, getPlan, listWorkoutLogs, getWorkoutLog };
}

export type TraineeApi = ReturnType<typeof createTraineeApi>;
