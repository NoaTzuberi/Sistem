import axios from 'axios';
import { apiClient } from '../api/apiClient';
import type {
  WorkoutSession,
  WorkoutSessionExerciseInput,
  FinishWorkoutResult,
  WorkoutSummary,
  LastLoggedExercise,
} from '../../features/workouts/types';

export interface ListWorkoutsParams {
  from?: string;
  to?: string;
  status?: string;
}

export async function listWorkouts(params: ListWorkoutsParams = {}): Promise<WorkoutSummary[]> {
  const { data } = await apiClient.get<{ items: WorkoutSummary[] }>('/workouts', { params });
  return data.items;
}

export async function getExerciseHistory(exerciseId: string): Promise<LastLoggedExercise | null> {
  const { data } = await apiClient.get<{ history: LastLoggedExercise | null }>(
    `/workouts/exercise-history/${exerciseId}`,
  );
  return data.history;
}

export async function startWorkout(templateId: string): Promise<WorkoutSession> {
  const { data } = await apiClient.post<{ workout: WorkoutSession }>('/workouts/start', { templateId });
  return data.workout;
}

export async function getActiveWorkout(): Promise<WorkoutSession | null> {
  try {
    const { data } = await apiClient.get<{ workout: WorkoutSession }>('/workouts/active');
    return data.workout;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getWorkoutById(id: string): Promise<WorkoutSession> {
  const { data } = await apiClient.get<{ workout: WorkoutSession }>(`/workouts/${id}`);
  return data.workout;
}

export async function updateWorkoutProgress(
  id: string,
  exercises: WorkoutSessionExerciseInput[],
): Promise<WorkoutSession> {
  const { data } = await apiClient.patch<{ workout: WorkoutSession }>(`/workouts/${id}/progress`, {
    exercises,
  });
  return data.workout;
}

export async function abandonWorkout(id: string): Promise<WorkoutSession> {
  const { data } = await apiClient.post<{ workout: WorkoutSession }>(`/workouts/${id}/abandon`);
  return data.workout;
}

export async function finishWorkout(
  id: string,
  input: { rating?: number; notes?: string },
): Promise<FinishWorkoutResult> {
  const { data } = await apiClient.post<FinishWorkoutResult>(`/workouts/${id}/finish`, input);
  return data;
}
