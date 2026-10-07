import type { AxiosInstance } from 'axios';
import type {
  AchievementOverview,
  AuthUser,
  BodyMetric,
  BodyMetricList,
  BodyMetricResponse,
  ProgressPhotoPose,
  SaveBodyMetricPayload,
  TraineePlan,
  TraineePlanList,
  TraineeWeek,
  WorkoutLog,
  WorkoutLogSetUpdate,
  WorkoutSession,
  WorkoutSummaryPayload,
  UpdatePreferencesPayload,
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

  // --- Body tracking (Phase 10): one day per date, kg / cm. A day left empty is
  // deleted, so the writes answer null for it.

  async function listBodyMetrics(): Promise<BodyMetricList> {
    const { data } = await client.get<BodyMetricList>('/body-metrics');
    return data;
  }

  /** The day as saved, and the achievements this save unlocked. */
  async function saveBodyMetric(date: string, payload: SaveBodyMetricPayload): Promise<BodyMetricResponse> {
    const { data } = await client.put<BodyMetricResponse>(`/body-metrics/${date}`, payload);
    return data;
  }

  async function deleteBodyMetricDay(date: string): Promise<void> {
    await client.delete(`/body-metrics/${date}`);
  }

  /** Sends the (already compressed) image as the raw body; replaces that pose's photo. */
  async function uploadProgressPhoto(
    date: string,
    pose: ProgressPhotoPose,
    photo: Blob,
    onProgress?: (fraction: number) => void,
  ): Promise<BodyMetricResponse> {
    const { data } = await client.put<BodyMetricResponse>(`/body-metrics/${date}/photos/${pose}`, photo, {
      headers: { 'Content-Type': photo.type || 'image/jpeg' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(event.loaded / event.total);
      },
    });
    return data;
  }

  async function removeProgressPhoto(date: string, pose: ProgressPhotoPose): Promise<BodyMetric | null> {
    const { data } = await client.delete<BodyMetricResponse>(`/body-metrics/${date}/photos/${pose}`);
    return data.metric;
  }

  /** Her display units (Settings); answers the updated user. */
  async function updatePreferences(payload: UpdatePreferencesPayload): Promise<AuthUser> {
    const { data } = await client.patch<{ user: AuthUser }>('/users/preferences', payload);
    return data.user;
  }

  // --- Achievements & streak (Phase 11): awarded by the server after saves.

  async function getAchievements(): Promise<AchievementOverview> {
    const { data } = await client.get<AchievementOverview>('/achievements');
    return data;
  }

  /** Their celebration was shown — they won't be celebrated again. */
  async function markAchievementsSeen(ids: string[]): Promise<void> {
    await client.post('/achievements/seen', { ids });
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
    listBodyMetrics,
    saveBodyMetric,
    deleteBodyMetricDay,
    uploadProgressPhoto,
    removeProgressPhoto,
    updatePreferences,
    getAchievements,
    markAchievementsSeen,
  };
}

export type TraineeApi = ReturnType<typeof createTraineeApi>;
