import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { LogoutButton } from '../../../../components/common/LogoutButton/LogoutButton';
import { FlagIcon, CalendarIcon, CompassIcon, DumbbellIcon, EditIcon } from '../../components/icons';
import { GOAL_OPTIONS, EQUIPMENT_OPTIONS } from '../../../onboarding/data/options';
import { ACTIVITIES } from '../../../onboarding/data/activities';
import type { OnboardingStepId } from '../../../onboarding/data/stepVideoMap';
import { getMyProfile } from '../../../../services/users/usersService';
import type { MyProfileResponse } from '../../../../services/users/usersService';
import { getDashboardSummary } from '../../../../services/dashboard/dashboardService';
import type { DashboardSummary } from '../../../dashboard/types';
import { StreakRing } from '../../../dashboard/components/StreakRing/StreakRing';
import { WeekDotStrip } from '../../../dashboard/components/WeekDotStrip/WeekDotStrip';
import { MilestoneBar } from '../../../dashboard/components/MilestoneBar/MilestoneBar';
import { AchievementBadges } from '../../../dashboard/components/AchievementBadges/AchievementBadges';
import { useAuth } from '../../../../services/auth/AuthContext';
import { useStaggerReveal } from '../../../../hooks/useStaggerReveal';
import { ROUTES, onboardingEditPath } from '../../../../app/config/routes';
import { IconChevronRight, IconSettings } from '@tabler/icons-react';
import { BodySummary } from '../../components/BodySummary/BodySummary';
import { PROFILE_COPY } from '../../data/profileCopy';
import { useMyBodyMetrics, useMyUnits } from '../../hooks/useMyBody';
import './ProfilePage.css';

const GOAL_LABELS = new Map(GOAL_OPTIONS.map((option) => [option.id, option.label]));
const EQUIPMENT_LABELS = new Map(EQUIPMENT_OPTIONS.map((option) => [option.id, option.label]));
const ACTIVITIES_BY_ID = new Map(ACTIVITIES.map((activity) => [activity.id, activity]));

function BadgeList({
  ids,
  labels,
  variant,
}: {
  ids: string[];
  labels: Map<string, string>;
  variant: 'accent' | 'neutral';
}) {
  if (ids.length === 0) {
    return <span className="profile-summary-empty">Not set yet</span>;
  }
  return (
    <div className="profile-summary-badges">
      {ids.map((id) => (
        <span key={id} className={`profile-tag profile-tag-${variant}`}>
          {labels.get(id) ?? id}
        </span>
      ))}
    </div>
  );
}

function ActivityBadgeList({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return <span className="profile-summary-empty">Not set yet</span>;
  }
  return (
    <div className="profile-summary-badges">
      {ids.map((id) => {
        const activity = ACTIVITIES_BY_ID.get(id);
        return (
          <span key={id} className="profile-tag profile-tag-success">
            {activity?.emoji && <span aria-hidden="true">{activity.emoji}</span>}
            {activity?.label ?? id}
          </span>
        );
      })}
    </div>
  );
}

type TrainingAccent = 'orange' | 'blue' | 'teal' | 'gray';

interface TrainingBlockProps {
  icon: React.ReactNode;
  title: string;
  accent: TrainingAccent;
  className?: string;
  editStep?: OnboardingStepId;
  children: React.ReactNode;
}

function TrainingBlock({ icon, title, accent, className, editStep, children }: TrainingBlockProps) {
  return (
    <GlassCard
      variant="flat"
      className={['training-block', `training-block-${accent}`, className].filter(Boolean).join(' ')}
    >
      <div className="training-block-header">
        <span className={`training-block-icon training-block-icon-${accent}`} aria-hidden="true">
          {icon}
        </span>
        <h3 className="training-block-title">{title}</h3>
        {editStep && (
          <Link to={onboardingEditPath(editStep)} className="training-block-edit" aria-label={`Edit ${title}`}>
            <EditIcon />
          </Link>
        )}
      </div>
      {children}
    </GlassCard>
  );
}

function FrequencyStrip({ minDays, maxDays }: { minDays: number; maxDays: number }) {
  const segments = Array.from({ length: 7 }, (_, index) => {
    if (index < minDays) return 'filled';
    if (index < maxDays) return 'tinted';
    return 'neutral';
  });

  return (
    <div className="frequency-strip" aria-hidden="true">
      {segments.map((state, index) => (
        <span key={index} className={`frequency-segment frequency-segment-${state}`} />
      ))}
    </div>
  );
}

function buildSummaryLine(profile: MyProfileResponse | null): string {
  if (!profile?.profile) return '';
  const parts: string[] = [];

  const goalsCount = profile.profile.goals.length;
  if (goalsCount > 0) {
    parts.push(`${goalsCount} goal${goalsCount === 1 ? '' : 's'}`);
  }

  const frequency = profile.profile.trainingFrequency;
  if (frequency) {
    parts.push(frequency.flexibleSchedule ? 'flexible schedule' : `${frequency.minDays}–${frequency.maxDays} days/week`);
  }

  const equipment = profile.profile.equipment;
  if (equipment.includes('full_gym')) {
    parts.push('full gym access');
  } else if (equipment.includes('home_equipment')) {
    parts.push('home equipment');
  } else if (equipment.includes('bodyweight_only') || equipment.includes('no_equipment')) {
    parts.push('bodyweight training');
  } else if (equipment.length > 0) {
    parts.push((EQUIPMENT_LABELS.get(equipment[0]) ?? equipment[0]).toLowerCase());
  }

  return parts.join(' · ');
}

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const trainingBlocksRef = useStaggerReveal<HTMLDivElement>([profile]);
  const layoutRef = useStaggerReveal<HTMLDivElement>([profile, dashboardSummary]);
  const body = useMyBodyMetrics();
  const { units } = useMyUnits();

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Couldn't load your profile.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    getDashboardSummary()
      .then(setDashboardSummary)
      .catch(() => {
        // The progress snapshot is a secondary widget on this page — if it
        // can't load, the card below just shows its own empty state instead
        // of blocking the rest of the profile.
      })
      .finally(() => setIsStatsLoading(false));
  }, []);

  const frequency = profile?.profile?.trainingFrequency;
  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';
  const summaryLine = buildSummaryLine(profile);

  return (
    <AppShell>
      <Section className="profile-page">
        <Container>
          <div className="profile-layout" ref={layoutRef}>
            <div className="profile-main-column">
              {!isLoading && !loadError && (
                <GlassCard
                  variant="flat"
                  className="profile-header-card"
                >
                  <div className="profile-header-banner">
                    <span className="profile-header-avatar" aria-hidden="true">
                      {initial}
                    </span>
                    <div className="profile-header-text">
                      <span className="profile-header-name">{user?.name}</span>
                      {summaryLine && <span className="profile-header-summary">{summaryLine}</span>}
                    </div>
                  </div>

                  <div className="profile-header-footer">
                    <div className="profile-account-row">
                      <span className="text-label">Email</span>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </GlassCard>
              )}

              <GlassCard variant="flat" className="profile-section-card profile-body-card">
                <h2>{PROFILE_COPY.bodyTitle}</h2>
                <BodySummary list={body.list} error={body.error} units={units} onRetry={body.reload} />
              </GlassCard>

              <GlassCard variant="flat" className="profile-section-card profile-training-card">
                <h2>Training Profile</h2>

                {isLoading && (
                  <div className="profile-loading-inline">
                    <Spinner size="md" />
                  </div>
                )}

                {!isLoading && loadError && <p className="profile-error">{loadError}</p>}

                {!isLoading && !loadError && (
                  <div className="training-block-grid" ref={trainingBlocksRef}>
                    <TrainingBlock
                      icon={<FlagIcon />}
                      title="Goals"
                      accent="orange"
                      className="training-block-goals"
                      editStep="goals"
                    >
                      <BadgeList ids={profile?.profile?.goals ?? []} labels={GOAL_LABELS} variant="accent" />
                    </TrainingBlock>

                    <TrainingBlock
                      icon={<CalendarIcon />}
                      title="Training Frequency"
                      accent="blue"
                      className="training-block-frequency"
                      editStep="frequency"
                    >
                      {frequency ? (
                        <>
                          <FrequencyStrip minDays={frequency.minDays} maxDays={frequency.maxDays} />
                          <span className="training-block-caption">
                            {frequency.minDays}–{frequency.maxDays} days/week
                            {frequency.flexibleSchedule && ' · Flexible schedule'}
                          </span>
                        </>
                      ) : (
                        <span className="profile-summary-empty">Not set yet</span>
                      )}
                    </TrainingBlock>

                    <TrainingBlock
                      icon={<CompassIcon />}
                      title="Preferred Activities"
                      accent="teal"
                      className="training-block-activities"
                      editStep="activities"
                    >
                      <ActivityBadgeList ids={profile?.profile?.preferredActivities ?? []} />
                    </TrainingBlock>

                    <TrainingBlock
                      icon={<DumbbellIcon />}
                      title="Equipment"
                      accent="gray"
                      className="training-block-equipment"
                      editStep="equipment"
                    >
                      <BadgeList ids={profile?.profile?.equipment ?? []} labels={EQUIPMENT_LABELS} variant="neutral" />
                    </TrainingBlock>
                  </div>
                )}

                <Link to={ROUTES.ONBOARDING} className="profile-redo-onboarding-link">
                  Redo full onboarding
                </Link>
              </GlassCard>
            </div>

            <div className="profile-side-column">
              <GlassCard variant="flat" className="profile-section-card profile-stats-card">
                <h2>Your Progress</h2>

                {isStatsLoading && (
                  <div className="profile-loading-inline">
                    <Spinner size="sm" />
                  </div>
                )}

                {!isStatsLoading && !dashboardSummary && (
                  <span className="profile-summary-empty">Progress data unavailable</span>
                )}

                {!isStatsLoading && dashboardSummary && (
                  <>
                    <div className="profile-stat-streak">
                      <StreakRing streak={dashboardSummary.streak} compact />
                      <div className="profile-stat-streak-text">
                        <span className="profile-stat-value">
                          {dashboardSummary.streak} day{dashboardSummary.streak === 1 ? '' : 's'}
                        </span>
                        <span className="profile-stat-caption">Current streak</span>
                      </div>
                    </div>

                    <div className="profile-stat-block">
                      <span className="text-label">Total Workouts</span>
                      <span className="profile-stat-block-value">{dashboardSummary.totalWorkouts}</span>
                      <MilestoneBar totalWorkouts={dashboardSummary.totalWorkouts} compact />
                    </div>

                    <div className="profile-stat-block">
                      <span className="text-label">This Week</span>
                      <WeekDotStrip workoutsLast7Days={dashboardSummary.workoutsLast7Days} compact />
                    </div>

                    <div className="profile-stat-block">
                      <span className="text-label">Achievements</span>
                      <AchievementBadges summary={dashboardSummary} limit={3} />
                    </div>
                  </>
                )}

                <Link to={ROUTES.SETTINGS} className="profile-settings-link">
                  <IconSettings size={20} aria-hidden="true" />
                  <span>{PROFILE_COPY.settings}</span>
                  <IconChevronRight size={20} aria-hidden="true" />
                </Link>
                <LogoutButton />
              </GlassCard>
            </div>
          </div>
        </Container>
      </Section>
    </AppShell>
  );
}
