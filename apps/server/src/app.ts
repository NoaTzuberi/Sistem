import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { healthRouter } from './features/health/health.routes';
import { authRouter } from './features/auth/auth.routes';
import { usersRouter } from './features/users/users.routes';
import { exercisesRouter } from './features/exercises/exercise.routes';
import { workoutTemplatesRouter } from './features/workoutTemplates/workoutTemplate.routes';
import { workoutsRouter } from './features/workouts/workout.routes';
import { personalRecordsRouter } from './features/personalRecords/personalRecord.routes';
import { progressRouter } from './features/progress/progress.routes';
import { dashboardRouter } from './features/dashboard/dashboard.routes';
import { onboardingRouter } from './features/onboarding/onboarding.routes';
import { plansRouter } from './features/plans/plan.routes';
import { workoutLogsRouter } from './features/workoutLogs/workoutLog.routes';
import { bodyMetricsRouter } from './features/bodyMetrics/bodyMetric.routes';
import { achievementsRouter } from './features/achievements/achievement.routes';
import { coachRouter } from './features/coach/coach.routes';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/workout-templates', workoutTemplatesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/personal-records', personalRecordsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/plans', plansRouter);
app.use('/api/workout-logs', workoutLogsRouter);
app.use('/api/body-metrics', bodyMetricsRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/coach', coachRouter);

export default app;
