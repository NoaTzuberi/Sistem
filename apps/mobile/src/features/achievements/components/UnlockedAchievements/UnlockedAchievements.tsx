import type { Achievement } from '@sistem/types';
import { describeAchievement } from '@sistem/shared';
import { markSeen } from '../../celebration';
import { usePopReveal } from '../../hooks/usePopReveal';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
import { ACHIEVEMENT_COPY } from '../../data/achievementCopy';
import './UnlockedAchievements.css';

interface UnlockedAchievementsProps {
  /** What this workout unlocked (the server attaches it to the log). */
  achievements: Achievement[];
}

/**
 * PRD §5.3 "achievements unlocked by this workout are revealed here". The ones not
 * celebrated yet pop in (GSAP) and are then marked seen; reopened later, the list just
 * shows. A Daily Pump upload can add one while the screen is open — only that one pops.
 */
export function UnlockedAchievements({ achievements }: UnlockedAchievementsProps) {
  const unseenIds = achievements.filter((achievement) => !achievement.seen).map((achievement) => achievement.id);
  const listRef = usePopReveal<HTMLUListElement>(unseenIds.join(','), () => void markSeen(unseenIds));

  if (achievements.length === 0) return null;
  return (
    <section className="unlocked-achievements" aria-labelledby="unlocked-achievements-title">
      <h2 className="unlocked-achievements-title" id="unlocked-achievements-title">
        {ACHIEVEMENT_COPY.unlockedThisWorkout}
      </h2>
      <ul className="unlocked-achievements-list" ref={listRef}>
        {achievements.map((achievement) => {
          const text = describeAchievement(achievement.type);
          return (
            <li key={achievement.id} className="unlocked-achievements-item" data-reveal={achievement.seen ? undefined : ''}>
              <AchievementBadge type={achievement.type} />
              <span className="unlocked-achievements-text">
                <span className="unlocked-achievements-name">{text.name}</span>
                <span className="unlocked-achievements-description">{text.description}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
