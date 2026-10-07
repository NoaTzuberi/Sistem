import type { Achievement } from '@sistem/types';
import { describeAchievement, formatUnlockedDate } from '@sistem/shared';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
import './AchievementTile.css';

interface AchievementTileProps {
  achievement: Achievement;
}

/** One unlocked achievement as a small tile: badge, name, date (Home strip). */
export function AchievementTile({ achievement }: AchievementTileProps) {
  return (
    <div className="achievement-tile">
      <AchievementBadge type={achievement.type} />
      <span className="achievement-tile-name">{describeAchievement(achievement.type).name}</span>
      <span className="achievement-tile-date">{formatUnlockedDate(achievement.unlockedAt)}</span>
    </div>
  );
}
