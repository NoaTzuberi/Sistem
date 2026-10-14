import type { AchievementOverview } from '@sistem/types';
import { formatNumber, formatVolume, sharedCopy, streakWeekLabel, useCopy, useLanguage } from '@sistem/shared';
import { Icon } from '../../../../components/common/Icon/Icon';
import { achievementCategoryClass, CATEGORY_ICON } from '../../data/achievementCategories';
import type { AchievementCategory } from '../../data/achievementCategories';
import { traineesCopy } from '../../copy';
import './AchievementStats.css';

/** Her lifetime numbers under the hero, each with a colored icon square (the color of its badge category). */
export function AchievementStats({ overview }: { overview: AchievementOverview }) {
  const language = useLanguage();
  const shared = useCopy(sharedCopy);
  const copy = useCopy(traineesCopy);
  const stats: { label: string; value: string; category: AchievementCategory }[] = [
    { label: copy.workouts, value: formatNumber(overview.stats.completedWorkouts, language), category: 'workouts' },
    { label: copy.thisWeek, value: streakWeekLabel(overview.streak, language) ?? copy.noPlanThisWeek, category: 'perfect' },
    { label: shared.coach.totalVolume, value: formatVolume(overview.stats.totalVolume, language), category: 'volume' },
    { label: copy.prs, value: formatNumber(overview.stats.personalRecords, language), category: 'records' },
  ];

  return (
    <dl className="ach-stats">
      {stats.map((stat) => (
        <div key={stat.label} className={`ach-stat ${achievementCategoryClass(stat.category)}`}>
          <span className="ach-stat-icon" aria-hidden="true">
            <Icon name={CATEGORY_ICON[stat.category]} size="sm" />
          </span>
          <dt className="ach-stat-label">{stat.label}</dt>
          <dd className="ach-stat-value">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
