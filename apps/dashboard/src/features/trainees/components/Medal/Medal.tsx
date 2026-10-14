import { Icon } from '../../../../components/common/Icon/Icon';
import { CATEGORY_ICON } from '../../data/achievementCategories';
import type { AchievementCategory } from '../../data/achievementCategories';
import './Medal.css';

interface MedalProps {
  category: AchievementCategory;
  unlocked: boolean;
  /** 0–1: the locked medal's progress ring (no ring stroke at 0). */
  fraction: number;
  size?: 'small' | 'regular' | 'large';
}

/**
 * An achievement's medal, in its category's color (--ach-color / --ach-light from the parent).
 * Unlocked: a glossy disc with a white ring and a glow. Locked: a grey embossed disc, a lock and
 * the progress ring. Decorative — the card around it says what it is.
 */
export function Medal({ category, unlocked, fraction, size = 'regular' }: MedalProps) {
  return (
    <span className={`medal medal-${size} ${unlocked ? 'medal-unlocked' : 'medal-locked'}`} aria-hidden="true">
      {!unlocked && (
        <svg className="medal-ring" viewBox="0 0 100 100">
          <circle className="medal-ring-track" cx="50" cy="50" r="46" />
          {fraction > 0 && (
            <circle className="medal-ring-progress" cx="50" cy="50" r="46" pathLength={1} strokeDasharray={`${fraction} 1`} transform="rotate(-90 50 50)" />
          )}
        </svg>
      )}
      <span className="medal-disc">
        <Icon name={CATEGORY_ICON[category]} className="medal-icon" />
      </span>
      {!unlocked && (
        <span className="medal-lock">
          <Icon name="lock" size="sm" />
        </span>
      )}
    </span>
  );
}
