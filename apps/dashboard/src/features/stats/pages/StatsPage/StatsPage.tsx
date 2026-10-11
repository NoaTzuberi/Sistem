import { useState } from 'react';
import type { CoachStats, CoachStatsRange } from '@sistem/types';
import { dateFormat, fill, formatNumber, formatWeekSpan, sharedCopy, useCopy, useLanguage } from '@sistem/shared';
import { PageHeader } from '../../../../components/common/PageHeader/PageHeader';
import { SegmentedControl } from '../../../../components/common/SegmentedControl/SegmentedControl';
import { StateLine } from '../../../../components/common/StateLine/StateLine';
import { WidgetCard } from '../../../../components/common/WidgetCard/WidgetCard';
import { formatChange, formatShare } from '../../../overview/data/overviewFormat';
import { AreaChart } from '../../components/AreaChart/AreaChart';
import { GoalBars } from '../../components/GoalBars/GoalBars';
import { RetentionRow } from '../../components/RetentionRow/RetentionRow';
import { StatTile } from '../../components/StatTile/StatTile';
import { WeeklyBars } from '../../components/WeeklyBars/WeeklyBars';
import { statsCopy } from '../../copy';
import { useCoachStats } from '../../hooks/useCoachStats';
import './StatsPage.css';

const DEFAULT_RANGE: CoachStatsRange = 6;

/** How the business and the trainees' consistency are doing — every number from GET /coach/stats. */
export function StatsPage() {
  const copy = useCopy(statsCopy);
  const [range, setRange] = useState<CoachStatsRange>(DEFAULT_RANGE);
  const { stats, hasError, reload } = useCoachStats(range);
  const ranges: { id: CoachStatsRange; label: string }[] = [
    { id: 3, label: copy.ranges.months3 },
    { id: 6, label: copy.ranges.months6 },
    { id: 12, label: copy.ranges.months12 },
  ];

  return (
    <div className="stats-page">
      <PageHeader title={copy.title} subtitle={copy.subtitle}>
        <SegmentedControl label={copy.rangeLabel} options={ranges} value={range} onChange={setRange} />
      </PageHeader>

      {!stats && !hasError && <StateLine />}
      {hasError && !stats && <StateLine error={copy.loadError} onRetry={reload} />}
      {stats && <StatsContent stats={stats} />}
    </div>
  );
}

function StatsContent({ stats }: { stats: CoachStats }) {
  const language = useLanguage();
  const copy = useCopy(statsCopy);
  const shared = useCopy(sharedCopy);
  const { summary } = stats;
  const none = shared.common.none;
  const goalLabels: Readonly<Record<string, string>> = shared.onboardingOptions.goals;

  const monthDate = (month: string) => new Date(`${month}-01T00:00:00Z`);
  const months = stats.activeByMonth.map((point) => ({
    key: point.month,
    axisLabel: dateFormat(language, { month: 'short', timeZone: 'UTC' }).format(monthDate(point.month)),
    label: dateFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(monthDate(point.month)),
    value: point.active,
  }));
  const weeks = stats.weeklyWorkouts.map((week) => ({
    key: week.weekStartDate,
    axisLabel: dateFormat(language, { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(`${week.weekStartDate}T00:00:00Z`)),
    label: formatWeekSpan(week.weekStartDate, language),
    value: week.completed,
  }));

  return (
    <>
      <dl className="stats-tiles">
        <StatTile
          label={copy.tiles.active}
          value={formatNumber(summary.activeTrainees, language)}
          change={formatChange(summary.activeTraineesChange, language)}
          note={copy.tiles.activeChange}
        />
        <StatTile
          label={copy.tiles.newThisMonth}
          value={formatNumber(summary.newTraineesThisMonth, language)}
          change={formatChange(summary.newTraineesChange, language)}
          note={copy.tiles.newChange}
        />
        <StatTile
          label={copy.tiles.completion}
          value={formatShare(summary.completedWorkouts, summary.plannedWorkouts, language) ?? none}
          note={copy.tiles.completionNote}
        />
        <StatTile
          label={copy.tiles.timeToPlan}
          value={summary.hoursToFirstPlan === null ? none : formatNumber(Math.round(summary.hoursToFirstPlan), language)}
          unit={summary.hoursToFirstPlan === null ? undefined : copy.tiles.hours}
          note={copy.tiles.timeToPlanNote}
        />
      </dl>

      <div className="stats-grid">
        <WidgetCard className="stats-span-7" title={copy.active.title} subtitle={copy.active.subtitle}>
          <AreaChart points={months} label={copy.active.label} unit={copy.active.unit} />
        </WidgetCard>
        <WidgetCard className="stats-span-5" title={copy.weekly.title} subtitle={copy.weekly.subtitle}>
          <WeeklyBars bars={weeks} label={copy.weekly.label} unit={copy.weekly.unit} />
        </WidgetCard>
        <WidgetCard
          className="stats-span-5"
          title={copy.goals.title}
          subtitle={fill(copy.goals.subtitle, { count: formatNumber(summary.activeTrainees, language) })}
        >
          <GoalBars goals={stats.goals.map((goal) => ({ id: goal.goalId, label: goalLabels[goal.goalId] ?? goal.goalId, count: goal.count }))} />
        </WidgetCard>
        <WidgetCard className="stats-span-7" title={copy.retention.title} subtitle={copy.retention.subtitle}>
          <RetentionRow retention={stats.retention} averageRating={summary.averageRating} />
        </WidgetCard>
      </div>
    </>
  );
}
