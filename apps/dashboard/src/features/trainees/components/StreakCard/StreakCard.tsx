import type { StreakSummary } from '@sistem/types';
import { fill, formatNumber, formatPlural, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { traineesCopy } from '../../copy';
import './StreakCard.css';

/** Her weekly streak on the achievements hero: a flame, the current run and her best (a cold flame at 0). */
export function StreakCard({ streak }: { streak: StreakSummary }) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy).achievementsTab;
  return (
    <div className={streak.current > 0 ? 'streak-card' : 'streak-card streak-card-cold'}>
      <span className="streak-card-flame" aria-hidden="true">
        <Icon name="flame" />
      </span>
      <b className="streak-card-count">{formatNumber(streak.current, language)}</b>
      <span className="streak-card-label">{formatPlural(language, copy.weeksInRow, streak.current)}</span>
      <small className="streak-card-best">{fill(copy.best, { count: formatNumber(streak.best, language) })}</small>
    </div>
  );
}
