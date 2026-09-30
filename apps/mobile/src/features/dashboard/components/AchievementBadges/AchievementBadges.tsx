import { useEffect, useState } from 'react';
import {
  FlagIcon,
  FlameIcon,
  StarIcon,
  TrophyIcon,
  ScaleIcon,
  CalendarIcon,
  RepeatIcon,
  LockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../icons';
import { useStaggerReveal } from '../../../../hooks/useStaggerReveal';
import { listPersonalRecords } from '../../../../services/personalRecords/personalRecordsService';
import { listProgressEntries } from '../../../../services/progress/progressService';
import { listWorkouts } from '../../../../services/workouts/workoutSessionService';
import { getMyProfile } from '../../../../services/users/usersService';
import type { DashboardSummary } from '../../types';
import './AchievementBadges.css';

const DEFAULT_WEEKLY_TARGET_DAYS = 3;
const CONSISTENCY_WEEKS_TO_CHECK = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const SCROLL_STEP = 196; // badge tile width (180px) + grid gap (16px)
const SCROLL_END_THRESHOLD = 4;

interface BadgeProgress {
  current: number;
  target: number;
  unitLabel: string;
}

interface BadgeContext {
  summary: DashboardSummary;
  personalRecordCount: number;
  weighInCount: number;
  weeklyTargetDays: number;
  consecutiveWeeksHittingGoal: number;
}

/** Counts consecutive rolling 7-day windows (most recent first) that meet the
 * daily target, walking backward until one window falls short. */
function countConsecutiveWeeksHittingGoal(
  workoutTimestamps: number[],
  targetDays: number,
  weeksToCheck: number,
): number {
  const now = Date.now();
  let consecutive = 0;

  for (let week = 0; week < weeksToCheck; week += 1) {
    const windowEnd = now - week * 7 * DAY_MS;
    const windowStart = windowEnd - 7 * DAY_MS;
    const count = workoutTimestamps.filter((t) => t > windowStart && t <= windowEnd).length;
    if (count >= targetDays) {
      consecutive += 1;
    } else {
      break;
    }
  }

  return consecutive;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  getProgress: (ctx: BadgeContext) => BadgeProgress;
}

const BADGES: BadgeDefinition[] = [
  {
    id: 'first-workout',
    name: 'First Workout',
    description: 'Complete your first workout',
    icon: <FlagIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.totalWorkouts, 1), target: 1, unitLabel: 'workout' }),
  },
  {
    id: 'seven-day-streak',
    name: '7-Day Streak',
    description: 'Train 7 days in a row',
    icon: <FlameIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.streak, 7), target: 7, unitLabel: 'days' }),
  },
  {
    id: 'first-pr',
    name: 'First PR',
    description: 'Set your first personal record',
    icon: <StarIcon />,
    getProgress: ({ summary }) => ({
      current: Math.min(summary.recentPersonalRecords.length, 1),
      target: 1,
      unitLabel: 'PR',
    }),
  },
  {
    id: 'ten-workouts',
    name: '10 Workouts',
    description: 'Complete 10 workouts',
    icon: <TrophyIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.totalWorkouts, 10), target: 10, unitLabel: 'workouts' }),
  },
  {
    id: 'thirty-day-streak',
    name: '30-Day Streak',
    description: 'Train 30 days in a row',
    icon: <FlameIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.streak, 30), target: 30, unitLabel: 'days' }),
  },
  {
    id: 'fifty-workouts',
    name: '50 Workouts',
    description: 'Complete 50 workouts',
    icon: <TrophyIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.totalWorkouts, 50), target: 50, unitLabel: 'workouts' }),
  },
  {
    id: 'hundred-workouts',
    name: '100 Workouts',
    description: 'Complete 100 workouts',
    icon: <TrophyIcon />,
    getProgress: ({ summary }) => ({
      current: Math.min(summary.totalWorkouts, 100),
      target: 100,
      unitLabel: 'workouts',
    }),
  },
  {
    id: 'first-weigh-in',
    name: 'First Weigh-In',
    description: 'Log your weight for the first time',
    icon: <ScaleIcon />,
    getProgress: ({ summary }) => ({
      current: summary.latestWeight !== undefined ? 1 : 0,
      target: 1,
      unitLabel: 'entry',
    }),
  },
  {
    id: 'three-day-streak',
    name: '3-Day Streak',
    description: 'Train 3 days in a row',
    icon: <FlameIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.streak, 3), target: 3, unitLabel: 'days' }),
  },
  {
    id: 'fourteen-day-streak',
    name: '14-Day Streak',
    description: 'Train 14 days in a row',
    icon: <FlameIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.streak, 14), target: 14, unitLabel: 'days' }),
  },
  {
    id: 'sixty-day-streak',
    name: '60-Day Streak',
    description: 'Train 60 days in a row',
    icon: <FlameIcon />,
    getProgress: ({ summary }) => ({ current: Math.min(summary.streak, 60), target: 60, unitLabel: 'days' }),
  },
  {
    id: 'five-prs',
    name: '5 Personal Records',
    description: 'Set 5 personal records',
    icon: <StarIcon />,
    getProgress: ({ personalRecordCount }) => ({
      current: Math.min(personalRecordCount, 5),
      target: 5,
      unitLabel: 'PRs',
    }),
  },
  {
    id: 'twentyfive-prs',
    name: '25 Personal Records',
    description: 'Set 25 personal records',
    icon: <StarIcon />,
    getProgress: ({ personalRecordCount }) => ({
      current: Math.min(personalRecordCount, 25),
      target: 25,
      unitLabel: 'PRs',
    }),
  },
  {
    id: 'two-hundred-workouts',
    name: '200 Workouts',
    description: 'Complete 200 workouts',
    icon: <TrophyIcon />,
    getProgress: ({ summary }) => ({
      current: Math.min(summary.totalWorkouts, 200),
      target: 200,
      unitLabel: 'workouts',
    }),
  },
  {
    id: 'weekly-goal-hit',
    name: 'Weekly Goal Hit',
    description: 'Complete your set weekly training day target',
    icon: <CalendarIcon />,
    getProgress: ({ summary, weeklyTargetDays }) => ({
      current: summary.workoutsLast7Days >= weeklyTargetDays ? 1 : 0,
      target: 1,
      unitLabel: '',
    }),
  },
  {
    id: 'consistency-champion',
    name: 'Consistency Champion',
    description: 'Hit your weekly goal 4 weeks in a row',
    icon: <RepeatIcon />,
    getProgress: ({ consecutiveWeeksHittingGoal }) => ({
      current: Math.min(consecutiveWeeksHittingGoal, 4),
      target: 4,
      unitLabel: 'weeks',
    }),
  },
  {
    id: 'ten-weigh-ins',
    name: '10 Weigh-Ins Logged',
    description: 'Log your weight 10 times',
    icon: <ScaleIcon />,
    getProgress: ({ weighInCount }) => ({
      current: Math.min(weighInCount, 10),
      target: 10,
      unitLabel: 'entries',
    }),
  },
];

interface AchievementBadgesProps {
  summary: DashboardSummary;
  /** When set, renders a short vertical list of the most notable badges
   * (earned first, then closest-to-unlocking) instead of the full scroll
   * strip — used for compact previews like the Profile page snapshot. */
  limit?: number;
}

export function AchievementBadges({ summary, limit }: AchievementBadgesProps) {
  const gridRef = useStaggerReveal<HTMLDivElement>([summary]);
  const [personalRecordCount, setPersonalRecordCount] = useState(0);
  const [weighInCount, setWeighInCount] = useState(0);
  const [weeklyTargetDays, setWeeklyTargetDays] = useState(DEFAULT_WEEKLY_TARGET_DAYS);
  const [consecutiveWeeksHittingGoal, setConsecutiveWeeksHittingGoal] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPersonalRecords(50)
      .then((records) => {
        if (!cancelled) setPersonalRecordCount(records.length);
      })
      .catch(() => {
        // PR badges just stay at 0 if records can't be loaded.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listProgressEntries(50)
      .then((entries) => {
        if (!cancelled) setWeighInCount(entries.length);
      })
      .catch(() => {
        // Weigh-in badge just stays at 0 if entries can't be loaded.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        const minDays = profile.profile?.trainingFrequency?.minDays;
        if (minDays) setWeeklyTargetDays(minDays);
      })
      .catch(() => {
        // Falls back to DEFAULT_WEEKLY_TARGET_DAYS if the profile can't be loaded.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const from = new Date(Date.now() - CONSISTENCY_WEEKS_TO_CHECK * 7 * DAY_MS).toISOString();
    listWorkouts({ from, status: 'completed' })
      .then((workouts) => {
        if (cancelled) return;
        const timestamps = workouts.map((w) => new Date(w.date).getTime());
        setConsecutiveWeeksHittingGoal(
          countConsecutiveWeeksHittingGoal(timestamps, weeklyTargetDays, CONSISTENCY_WEEKS_TO_CHECK),
        );
      })
      .catch(() => {
        // Consistency Champion progress just stays at 0 if history can't be loaded.
      });
    return () => {
      cancelled = true;
    };
  }, [weeklyTargetDays]);

  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    const updateScrollState = () => {
      setCanScrollLeft(container.scrollLeft > SCROLL_END_THRESHOLD);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - SCROLL_END_THRESHOLD,
      );
    };

    updateScrollState();
    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [summary]);

  const scrollByStep = (direction: 1 | -1) => {
    gridRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  };

  const ctx: BadgeContext = {
    summary,
    personalRecordCount,
    weighInCount,
    weeklyTargetDays,
    consecutiveWeeksHittingGoal,
  };

  const computedBadges = BADGES.map((badge) => {
    const { current, target, unitLabel } = badge.getProgress(ctx);
    return {
      badge,
      current,
      target,
      unitLabel,
      earned: current >= target,
      progressRatio: current / target,
    };
  });

  // No "earned at" timestamps exist yet, so this favors earned badges (harder
  // ones first, as a proxy for "most impressive") and otherwise falls back to
  // whichever locked badge is closest to unlocking.
  const displayBadges = limit
    ? [...computedBadges]
        .sort((a, b) => {
          if (a.earned !== b.earned) return a.earned ? -1 : 1;
          if (a.earned) return b.target - a.target;
          return b.progressRatio - a.progressRatio;
        })
        .slice(0, limit)
    : computedBadges;

  function renderTile({ badge, current, target, unitLabel, earned }: (typeof computedBadges)[number]) {
    const progressPct = Math.min(100, (current / target) * 100);

    return (
      <div
        key={badge.id}
        className={
          'badge-tile' +
          (limit ? ' badge-tile-compact' : '') +
          (earned ? ' badge-tile-earned' : ' badge-tile-locked')
        }
        tabIndex={0}
      >
        <span className="badge-tile-icon">{badge.icon}</span>
        <span className="badge-tile-name">{badge.name}</span>

        {!earned && (
          <>
            <span className="badge-tile-progress-text">
              {current}/{target}
              {unitLabel && ` ${unitLabel}`}
            </span>
            <span className="badge-tile-lock" aria-hidden="true">
              <LockIcon />
            </span>
            <div className="badge-tile-progress-track" aria-hidden="true">
              <div className="badge-tile-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </>
        )}

        {!limit && (
          <span className="badge-tile-tooltip" role="tooltip">
            {earned ? 'Unlocked' : badge.description}
          </span>
        )}
      </div>
    );
  }

  if (limit) {
    return (
      <div className="achievements-grid achievements-grid-compact" ref={gridRef}>
        {displayBadges.map(renderTile)}
      </div>
    );
  }

  return (
    <div className="achievements-scroll-wrapper">
      <button
        type="button"
        className="achievements-scroll-arrow achievements-scroll-arrow-left"
        onClick={() => scrollByStep(-1)}
        disabled={!canScrollLeft}
        aria-label="Scroll achievements left"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        className="achievements-scroll-arrow achievements-scroll-arrow-right"
        onClick={() => scrollByStep(1)}
        disabled={!canScrollRight}
        aria-label="Scroll achievements right"
      >
        <ChevronRightIcon />
      </button>
      <div className="achievements-grid" ref={gridRef}>
        {displayBadges.map(renderTile)}
      </div>
    </div>
  );
}
