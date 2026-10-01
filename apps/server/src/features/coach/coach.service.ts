import type { HydratedDocument } from 'mongoose';
import type { CoachTraineeDetail, CoachTraineeSummary } from '@sistem/types';
import { User } from '../users/user.model';
import type { UserDocument } from '../users/user.model';
import { OnboardingResponse } from '../onboarding/onboardingResponse.model';
import { toMyOnboarding } from '../onboarding/onboarding.service';

// The human Coach's view of her trainees (PRD §6). Every query is scoped by coachId —
// never "all trainees" — so several coaches can share the database later.

function toTraineeSummary(user: HydratedDocument<UserDocument>): CoachTraineeSummary {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    onboardingStatus: user.onboardingStatus,
    onboardingCompletedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
    timezone: user.timezone,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listCoachTrainees(coachId: string): Promise<CoachTraineeSummary[]> {
  const trainees = await User.find({ role: 'trainee', coachId }).sort({ createdAt: -1 });
  return trainees.map(toTraineeSummary);
}

/** Call only after loadCoachTrainee has checked the trainee belongs to this coach. */
export async function getCoachTraineeDetail(traineeId: string): Promise<CoachTraineeDetail> {
  const trainee = await User.findById(traineeId);
  if (!trainee) {
    throw new Error('Trainee disappeared after the ownership check.');
  }
  const response = await OnboardingResponse.findOne({ userId: traineeId }).lean();
  return {
    ...toTraineeSummary(trainee),
    onboarding: response || trainee.onboardingStatus !== 'not_started' ? toMyOnboarding(trainee, response) : null,
  };
}
