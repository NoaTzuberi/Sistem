import type { AxiosInstance } from 'axios';
import type {
  TraineePlan,
  TraineePlanList,
  TraineeWeek,
  WorkoutLog,
  WorkoutLogSetUpdate,
  WorkoutSession,
  WorkoutSummaryPayload,
} from '@sistem/types';

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

  // --- The active workout session (Phase 8). A 409 on start carries an
  // ActiveWorkoutConflictBody when another workout is still open.

  /** Starts this workout, or resumes it if it is already open (`resumed`: 200, not 201). */
  async function startWorkout(planId: string, workoutId: string): Promise<{ session: WorkoutSession; resumed: boolean }> {
    const response = await client.post<{ session: WorkoutSession }>('/workout-logs', { planId, workoutId });
    return { session: response.data.session, resumed: response.status === 200 };
  }

  async function getActiveSession(): Promise<WorkoutSession | null> {
    const { data } = await client.get<{ session: WorkoutSession | null }>('/workout-logs/active');
    return data.session;
  }

  async function getSession(logId: string): Promise<WorkoutSession> {
    const { data } = await client.get<{ session: WorkoutSession }>(`/workout-logs/${logId}/session`);
    return data.session;
  }

  async function updateWorkoutSets(logId: string, sets: WorkoutLogSetUpdate[]): Promise<WorkoutLog> {
    const { data } = await client.patch<{ log: WorkoutLog }>(`/workout-logs/${logId}/sets`, { sets });
    return data.log;
  }

  /** Sends the last unsent set changes with the finish, so nothing is lost on the way. */
  async function finishWorkout(logId: string, sets: WorkoutLogSetUpdate[] = []): Promise<WorkoutLog> {
    const { data } = await client.post<{ log: WorkoutLog }>(`/workout-logs/${logId}/finish`, { sets });
    return data.log;
  }

  async function abandonWorkout(logId: string): Promise<WorkoutLog> {
    const { data } = await client.post<{ log: WorkoutLog }>(`/workout-logs/${logId}/abandon`);
    return data.log;
  }

  // --- The summary (Phase 9): her own finished workouts, editable any time.

  async function updateWorkoutSummary(logId: string, payload: WorkoutSummaryPayload): Promise<WorkoutLog> {
    const { data } = await client.patch<{ log: WorkoutLog }>(`/workout-logs/${logId}/summary`, payload);
    return data.log;
  }

  /** Sends the (already compressed) image as the raw body; replaces any earlier photo. */
  async function uploadPumpPhoto(
    logId: string,
    photo: Blob,
    onProgress?: (fraction: number) => void,
  ): Promise<WorkoutLog> {
    const { data } = await client.put<{ log: WorkoutLog }>(`/workout-logs/${logId}/pump-photo`, photo, {
      headers: { 'Content-Type': photo.type || 'image/jpeg' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(event.loaded / event.total);
      },
    });
    return data.log;
  }

  async function removePumpPhoto(logId: string): Promise<WorkoutLog> {
    const { data } = await client.delete<{ log: WorkoutLog }>(`/workout-logs/${logId}/pump-photo`);
    return data.log;
  }

  return {
    getWeek,
    listPlans,
    getPlan,
    listWorkoutLogs,
    getWorkoutLog,
    startWorkout,
    getActiveSession,
    getSession,
    updateWorkoutSets,
    finishWorkout,
    abandonWorkout,
    updateWorkoutSummary,
    uploadPumpPhoto,
    removePumpPhoto,
  };
}

export type TraineeApi = ReturnType<typeof createTraineeApi>;
