import type { AchievementProgress } from '@sistem/types';
import { describeAchievement, describeAchievementProgress, fill, formatUnlockedDate, useCopy, useLanguage } from '@sistem/shared';
import { AchievementBadge } from '../AchievementBadge/AchievementBadge';
import { achievementCopy } from '../../copy';
import './AchievementList.css';

interface AchievementListProps {
  /** The server's progress list, in config order. */
  progress: AchievementProgress[];
}

function Row({ entry }: { entry: AchievementProgress }) {
  const language = useLanguage();
  const copy = useCopy(achievementCopy);
  const text = describeAchievement(entry.type, language);
  const unlocked = entry.count > 0;
  const progressText = describeAchievementProgress(entry, language);
  return (
    <li className={'achievement-row' + (unlocked ? ' achievement-row-unlocked' : '')}>
      <AchievementBadge type={entry.type} locked={!unlocked} />
      <div className="achievement-row-text">
        <span className="achievement-row-name">
          {text.name}
          {entry.repeatable && entry.count > 1 && <span className="achievement-row-count"> {fill(copy.times, { count: entry.count })}</span>}
        </span>
        <span className="achievement-row-description">{text.description}</span>
        {unlocked && entry.unlockedAt && (
          <span className="achievement-row-meta">{fill(copy.unlockedOn, { date: formatUnlockedDate(entry.unlockedAt, language) })}</span>
        )}
        {!unlocked && !entry.repeatable && entry.threshold !== undefined && (
          <>
            <progress className="achievement-row-progress" value={Math.min(entry.current, entry.threshold)} max={entry.threshold} />
            {progressText && <span className="achievement-row-meta">{progressText}</span>}
          </>
        )}
      </div>
    </li>
  );
}

/** Every achievement: unlocked first (newest first), then the rest with her progress. */
export function AchievementList({ progress }: AchievementListProps) {
  const copy = useCopy(achievementCopy);
  const unlocked = progress
    .filter((entry) => entry.count > 0)
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''));
  const locked = progress.filter((entry) => entry.count === 0);

  return (
    <div className="achievement-list">
      {unlocked.length > 0 && (
        <section aria-labelledby="achievements-unlocked">
          <h2 className="achievement-list-title" id="achievements-unlocked">
            {copy.unlockedTitle}
          </h2>
          <ul className="achievement-list-rows">
            {unlocked.map((entry) => (
              <Row key={entry.type} entry={entry} />
            ))}
          </ul>
        </section>
      )}
      {locked.length > 0 && (
        <section aria-labelledby="achievements-locked">
          <h2 className="achievement-list-title" id="achievements-locked">
            {copy.lockedTitle}
          </h2>
          <ul className="achievement-list-rows">
            {locked.map((entry) => (
              <Row key={entry.type} entry={entry} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
