import { useCopy, useLoad } from '@sistem/shared';
import { getAchievements } from '../../../services/achievements/achievementsService';
import { achievementCopy } from '../copy';

/** Her streak, stats and achievements (Home, Profile, the achievements screen). */
export function useMyAchievements() {
  const copy = useCopy(achievementCopy);
  return useLoad(getAchievements, copy.loadError);
}
