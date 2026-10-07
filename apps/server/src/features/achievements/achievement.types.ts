import type { Types } from 'mongoose';

export interface AchievementDocument {
  traineeId: Types.ObjectId;
  type: string;
  key: string;
  value?: number;
  unlockedAt: Date;
  sourceLogId?: Types.ObjectId | null;
  sourceBodyMetricId?: Types.ObjectId | null;
  seenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
