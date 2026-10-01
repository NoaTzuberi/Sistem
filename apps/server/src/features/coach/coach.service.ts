import type { HydratedDocument, Types } from 'mongoose';
import type { CoachTraineeDetail, CoachTraineeSummary, PlanStatus, TraineeStatus } from '@sistem/types';
import { User } from '../users/user.model';
import type { UserDocument } from '../users/user.model';
import { OnboardingResponse } from '../onboarding/onboardingResponse.model';
import { toMyOnboarding } from '../onboarding/onboarding.service';
import { PLAN_WAIT_MS } from '../onboarding/onboarding.constants';
import { Plan } from '../plans/plan.model';
import { addDays, currentWeekStart } from '../plans/planWeek';
import { WorkoutLog } from '../workoutLogs/workoutLog.model';

// The human Coach's view of her trainees (PRD §6). Every query is scoped by coachId —
// never "all trainees" — so several coaches can share the database later.

interface PlanWeek {
  weekStartDate: string;
  status: PlanStatus;
}

interface TraineeStatusInput {
  onboardingCompleted: boolean;
  /** Sunday of the current week in the trainee's time zone */
  currentWeek: string;
  plans: PlanWeek[];
}

/**
 * The trainee's place in the coach's list (PRD §6), and whether next week still has
 * no plan at all. Weeks are compared as 'YYYY-MM-DD' strings in the trainee's zone.
 */
export function resolveTraineeStatus({ onboardingCompleted, currentWeek, plans }: TraineeStatusInput): {
  status: TraineeStatus;
  needsNextWeekPlan: boolean;
} {
  if (!onboardingCompleted) return { status: 'new', needsNextWeekPlan: false };

  const published = plans.filter((plan) => plan.status === 'published');
  if (published.length === 0) return { status: 'waiting', needsNextWeekPlan: false };

  if (!published.some((plan) => plan.weekStartDate >= currentWeek)) {
    return { status: 'inactive', needsNextWeekPlan: false };
  }
  const nextWeek = addDays(currentWeek, 7);
  return { status: 'active', needsNextWeekPlan: !plans.some((plan) => plan.weekStartDate === nextWeek) };
}

async function toTraineeSummaries(users: HydratedDocument<UserDocument>[], now: Date): Promise<CoachTraineeSummary[]> {
  const ids = users.map((user) => user._id);
  const [plans, lastLogs] = await Promise.all([
    Plan.find({ traineeId: { $in: ids } })
      .select('traineeId weekStartDate status')
      .lean<(PlanWeek & { traineeId: Types.ObjectId })[]>(),
    WorkoutLog.aggregate<{ _id: Types.ObjectId; lastActivityAt: Date }>([
      { $match: { traineeId: { $in: ids } } },
      { $group: { _id: '$traineeId', lastActivityAt: { $max: '$startedAt' } } },
    ]),
  ]);

  const plansByTrainee = new Map<string, PlanWeek[]>();
  for (const plan of plans) {
    const key = String(plan.traineeId);
    plansByTrainee.set(key, [...(plansByTrainee.get(key) ?? []), plan]);
  }
  const lastActivity = new Map(lastLogs.map((entry) => [String(entry._id), entry.lastActivityAt]));

  return users.map((user) => {
    const id = String(user._id);
    const currentWeek = currentWeekStart(user.timezone, now);
    const { status, needsNextWeekPlan } = resolveTraineeStatus({
      onboardingCompleted: user.onboardingStatus === 'completed',
      currentWeek,
      plans: plansByTrainee.get(id) ?? [],
    });
    const completedAt = user.onboardingCompletedAt ?? null;

    return {
      id,
      name: user.name,
      email: user.email,
      onboardingStatus: user.onboardingStatus,
      onboardingCompletedAt: completedAt ? completedAt.toISOString() : null,
      timezone: user.timezone,
      createdAt: user.createdAt.toISOString(),
      status,
      planDueAt:
        status === 'waiting' && completedAt ? new Date(completedAt.getTime() + PLAN_WAIT_MS).toISOString() : null,
      needsNextWeekPlan,
      lastActivityAt: lastActivity.get(id)?.toISOString() ?? null,
      currentWeekStart: currentWeek,
    };
  });
}

export async function listCoachTrainees(coachId: string, now: Date = new Date()): Promise<CoachTraineeSummary[]> {
  const trainees = await User.find({ role: 'trainee', coachId }).sort({ createdAt: -1 });
  return toTraineeSummaries(trainees, now);
}

/** Call only after loadCoachTrainee has checked the trainee belongs to this coach. */
export async function getCoachTraineeDetail(traineeId: string, now: Date = new Date()): Promise<CoachTraineeDetail> {
  const trainee = await User.findById(traineeId);
  if (!trainee) {
    throw new Error('Trainee disappeared after the ownership check.');
  }
  const [[summary], response] = await Promise.all([
    toTraineeSummaries([trainee], now),
    OnboardingResponse.findOne({ userId: traineeId }).lean(),
  ]);
  return {
    ...summary,
    onboarding: response || trainee.onboardingStatus !== 'not_started' ? toMyOnboarding(trainee, response) : null,
  };
}
