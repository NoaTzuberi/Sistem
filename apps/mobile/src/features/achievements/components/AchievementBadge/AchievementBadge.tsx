import type { AchievementType } from '@sistem/types';
import { IconLock, IconTrophy } from '@tabler/icons-react';
import { ACHIEVEMENT_ICONS } from '../../data/achievementIcons';
import './AchievementBadge.css';

interface AchievementBadgeProps {
  type: AchievementType;
  locked?: boolean;
  size?: 'sm' | 'lg';
}

/** The icon slot of one achievement: the owner's image when there is one, else a placeholder. */
export function AchievementBadge({ type, locked = false, size = 'sm' }: AchievementBadgeProps) {
  const src = ACHIEVEMENT_ICONS[type];
  const classNames = ['achievement-badge', `achievement-badge-${size}`, locked && 'achievement-badge-locked'].filter(Boolean).join(' ');
  return (
    <span className={classNames} aria-hidden="true">
      {src ? <img className="achievement-badge-image" src={src} alt="" /> : locked ? <IconLock /> : <IconTrophy />}
    </span>
  );
}
