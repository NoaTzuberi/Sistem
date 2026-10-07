import { useLoad } from '@sistem/shared';
import { getAchievements } from '../../../services/achievements/achievementsService';
import { ACHIEVEMENT_COPY } from '../data/achievementCopy';

/** Her streak, stats and achievements (Home, Profile, the achievements screen). */
export function useMyAchievements() {
  return useLoad(getAchievements, ACHIEVEMENT_COPY.loadError);
}
