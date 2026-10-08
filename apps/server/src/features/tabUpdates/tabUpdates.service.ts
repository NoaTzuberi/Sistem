import type { TabUpdates, UpdateTab } from '@sistem/types';
import { User } from '../users/user.model';
import { Plan } from '../plans/plan.model';
import { latestNutritionPublishTime } from '../nutrition/nutritionPlan.service';

// The "unseen update" dot on the trainee's tab bar (Phase 13a, owner decision): Workouts
// when a training plan was published or a published one changed, Nutrition when a new
// nutrition version was published — since she last opened that tab. "Last seen" lives on
// the server (User.tabSeenAt), so it is the same on every device.

export const UPDATE_TABS = ['workouts', 'nutrition'] as const satisfies readonly UpdateTab[];

/** The newest change she could see on her Workouts tab. */
async function latestWorkoutsChange(traineeId: string): Promise<Date | null> {
  const [byLiveUpdate, byPublish] = await Promise.all([
    Plan.findOne({ traineeId, status: 'published', liveUpdatedAt: { $ne: null } }).sort({ liveUpdatedAt: -1 }).select('liveUpdatedAt').lean(),
    // Plans published before Phase 13a have no liveUpdatedAt.
    Plan.findOne({ traineeId, status: 'published' }).sort({ publishedAt: -1 }).select('publishedAt').lean(),
  ]);
  const times = [byLiveUpdate?.liveUpdatedAt, byPublish?.publishedAt].filter((time): time is Date => time instanceof Date);
  return times.length > 0 ? new Date(Math.max(...times.map((time) => time.getTime()))) : null;
}

function isUnseen(changedAt: Date | null, seenAt: Date | null | undefined): boolean {
  return changedAt !== null && (!seenAt || changedAt > seenAt);
}

export async function getTabUpdates(traineeId: string): Promise<TabUpdates> {
  const [user, workoutsChange, nutritionChange] = await Promise.all([
    User.findById(traineeId).select('tabSeenAt').lean(),
    latestWorkoutsChange(traineeId),
    latestNutritionPublishTime(traineeId),
  ]);
  return {
    workouts: isUnseen(workoutsChange, user?.tabSeenAt?.workouts),
    nutrition: isUnseen(nutritionChange, user?.tabSeenAt?.nutrition),
  };
}

/** She opened the tab: everything published until now (server time) is seen. */
export async function markTabSeen(traineeId: string, tab: UpdateTab): Promise<TabUpdates> {
  await User.updateOne({ _id: traineeId }, { $set: { [`tabSeenAt.${tab}`]: new Date() } });
  return getTabUpdates(traineeId);
}
