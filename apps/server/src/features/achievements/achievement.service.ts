import type { Types } from 'mongoose';
import type { Achievement as PublicAchievement } from '@sistem/types';
import { Achievement } from './achievement.model';
import type { AchievementDocument } from './achievement.types';

type LeanAchievement = AchievementDocument & { _id: Types.ObjectId };

export function toPublicAchievement(achievement: LeanAchievement): PublicAchievement {
  return {
    id: String(achievement._id),
    traineeId: String(achievement.traineeId),
    type: achievement.type,
    value: achievement.value,
    unlockedAt: achievement.unlockedAt.toISOString(),
    sourceLogId: achievement.sourceLogId ? String(achievement.sourceLogId) : null,
    sourceBodyMetricId: achievement.sourceBodyMetricId ? String(achievement.sourceBodyMetricId) : null,
  };
}

export async function listAchievementsForTrainee(traineeId: string): Promise<PublicAchievement[]> {
  const achievements = await Achievement.find({ traineeId }).sort({ unlockedAt: -1 }).lean<LeanAchievement[]>();
  return achievements.map(toPublicAchievement);
}
