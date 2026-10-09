import { useCopy } from '@sistem/shared';
import { Link } from 'react-router-dom';
import type { Achievement } from '@sistem/types';
import { ROUTES } from '../../../../app/config/routes';
import { StateMessage } from '../../../../components/common/StateMessage/StateMessage';
import { AchievementTile } from '../AchievementTile/AchievementTile';
import { achievementCopy } from '../../copy';
import './AchievementStrip.css';

const STRIP_LIMIT = 6;

interface AchievementStripProps {
  /** Newest first (the server's order). */
  achievements: Achievement[];
  titleId: string;
}

/** Home's "Recent achievements" (PRD §5.1): the latest unlocks, swiped sideways, and a link to all. */
export function AchievementStrip({ achievements, titleId }: AchievementStripProps) {
  const copy = useCopy(achievementCopy);
  return (
    <section className="achievement-strip" aria-labelledby={titleId}>
      <div className="achievement-strip-header">
        <h2 className="achievement-strip-title" id={titleId}>
          {copy.recent}
        </h2>
        <Link className="achievement-strip-link" to={ROUTES.PROFILE_ACHIEVEMENTS}>
          {copy.seeAll}
        </Link>
      </div>
      {achievements.length === 0 ? (
        <StateMessage>{copy.none}</StateMessage>
      ) : (
        <ul className="achievement-strip-list">
          {achievements.slice(0, STRIP_LIMIT).map((achievement) => (
            <li key={achievement.id} className="achievement-strip-item">
              <AchievementTile achievement={achievement} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
