import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { Button } from '../../../../components/common/Button/Button';
import { Modal } from '../../../../components/common/Modal/Modal';
import { Input } from '../../../../components/common/Input/Input';
import { getDashboardSummary } from '../../../../services/dashboard/dashboardService';
import { createProgressEntry } from '../../../../services/progress/progressService';
import { useAuth } from '../../../../services/auth/AuthContext';
import { useStaggerReveal } from '../../../../hooks/useStaggerReveal';
import { StreakRing, STREAK_RING_TARGET } from '../../components/StreakRing/StreakRing';
import { WeekDotStrip } from '../../components/WeekDotStrip/WeekDotStrip';
import { MilestoneBar } from '../../components/MilestoneBar/MilestoneBar';
import { AchievementBadges } from '../../components/AchievementBadges/AchievementBadges';
import { DashboardCalendar } from '../../components/DashboardCalendar/DashboardCalendar';
import { FlameIcon, CalendarIcon, TrophyIcon, ScaleIcon, DumbbellIcon, RepsIcon } from '../../components/icons';
import type { DashboardPersonalRecord, DashboardSummary, WeightTrendPoint } from '../../types';
import './DashboardPage.css';

const WEIGHT_CHART_WIDTH = 400;
const WEIGHT_CHART_HEIGHT = 100;

interface MergedPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight?: number;
  reps?: number;
  date: string;
}

/** Groups PRs by exercise so a lift with both a weight and a reps PR shows as
 * one card instead of two separate rows for the same exercise. */
function mergePersonalRecords(records: DashboardPersonalRecord[]): MergedPersonalRecord[] {
  const byExercise = new Map<string, MergedPersonalRecord>();

  for (const pr of records) {
    const existing = byExercise.get(pr.exercise.id);
    const merged: MergedPersonalRecord = existing ?? {
      exerciseId: pr.exercise.id,
      exerciseName: pr.exercise.name,
      date: pr.date,
    };

    if (pr.type === 'weight' && merged.weight === undefined) {
      merged.weight = pr.newValue;
    }
    if (pr.type === 'reps' && merged.reps === undefined) {
      merged.reps = pr.newValue;
    }
    if (new Date(pr.date) > new Date(merged.date)) {
      merged.date = pr.date;
    }

    byExercise.set(pr.exercise.id, merged);
  }

  return Array.from(byExercise.values());
}

function formatRelativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function buildWeightChartPoints(points: WeightTrendPoint[]): string {
  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const stepX = WEIGHT_CHART_WIDTH / (points.length - 1);

  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = WEIGHT_CHART_HEIGHT - ((point.weight - min) / range) * (WEIGHT_CHART_HEIGHT - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Same coordinates as buildWeightChartPoints, closed down to the chart's
 * baseline so the shape can be filled as an area instead of just stroked
 * as a line. */
function buildWeightChartArea(points: WeightTrendPoint[]): string {
  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const stepX = WEIGHT_CHART_WIDTH / (points.length - 1);

  const linePoints = points.map((point, index) => {
    const x = index * stepX;
    const y = WEIGHT_CHART_HEIGHT - ((point.weight - min) / range) * (WEIGHT_CHART_HEIGHT - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const firstX = 0;
  const lastX = (points.length - 1) * stepX;
  return `M${firstX},${WEIGHT_CHART_HEIGHT} L${linePoints.join(' L')} L${lastX},${WEIGHT_CHART_HEIGHT} Z`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [isLogWeightOpen, setIsLogWeightOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const bentoRef = useStaggerReveal<HTMLDivElement>([summary]);
  const weightPolylineRef = useRef<SVGPolylineElement>(null);
  const weightEmptyLineRef = useRef<SVGLineElement>(null);

  async function loadSummary() {
    setIsLoading(true);
    setLoadError(undefined);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load your dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  // Draw in the weight line whenever the underlying data changes.
  useEffect(() => {
    if (!summary) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const weightLineEl = weightPolylineRef.current ?? weightEmptyLineRef.current;
    if (!weightLineEl) return;

    const length = weightLineEl.getTotalLength();
    const animation = gsap.fromTo(
      weightLineEl,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 },
    );

    return () => {
      animation.kill();
    };
  }, [summary]);

  async function handleLogWeight() {
    const weight = Number(weightInput);
    if (!weightInput || Number.isNaN(weight) || weight <= 0) {
      setSaveError('Enter a valid weight.');
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    try {
      await createProgressEntry({ weight });
      setIsLogWeightOpen(false);
      setWeightInput('');
      await loadSummary();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save this entry.");
    } finally {
      setIsSaving(false);
    }
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? '?';
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const mergedPersonalRecords = summary ? mergePersonalRecords(summary.recentPersonalRecords) : [];

  return (
    <AppShell>
      <Container>
        <div className="dashboard-page">
          <div className="dashboard-actions-row">
            <Button onClick={() => setIsLogWeightOpen(true)}>Log Weight</Button>
          </div>

          {isLoading && (
            <div className="dashboard-loading">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && loadError && <p className="dashboard-error">{loadError}</p>}

          {!isLoading && !loadError && summary && (
            <>
              <div className="welcome-banner">
                <span className="welcome-banner-avatar" aria-hidden="true">
                  {initial}
                </span>
                <div className="welcome-banner-text">
                  <span className="welcome-banner-greeting">Welcome back, {firstName}</span>
                </div>
                <div className="welcome-banner-streak">
                  <FlameIcon />
                  <span>
                    {summary.streak} day{summary.streak === 1 ? '' : 's'} streak
                  </span>
                </div>
              </div>

              <div className="bento-grid" ref={bentoRef}>
                <GlassCard variant="flat" className="bento-tile bento-tile-streak">
                  <StreakRing streak={summary.streak} />
                  <span className="dashboard-stat-label">Day Streak</span>
                  <span className="dashboard-stat-microcopy">
                    {summary.streak === 0 ? 'Start today to light it up' : `${STREAK_RING_TARGET}-day ring`}
                  </span>
                </GlassCard>

                <GlassCard variant="flat" className="bento-tile bento-tile-week">
                  <span className="dashboard-stat-badge" aria-hidden="true">
                    <CalendarIcon />
                  </span>
                  <span className="dashboard-stat-label">This Week</span>
                  <WeekDotStrip workoutsLast7Days={summary.workoutsLast7Days} />
                </GlassCard>

                <GlassCard variant="flat" className="bento-tile bento-tile-total">
                  <span className="dashboard-stat-badge" aria-hidden="true">
                    <TrophyIcon />
                  </span>
                  <span className="dashboard-stat-value">{summary.totalWorkouts}</span>
                  <span className="dashboard-stat-label">Total Workouts</span>
                  <MilestoneBar totalWorkouts={summary.totalWorkouts} />
                </GlassCard>

                <GlassCard variant="flat" className="bento-tile bento-tile-weight">
                  <div className="dashboard-weight-header">
                    <span className="dashboard-stat-badge" aria-hidden="true">
                      <ScaleIcon />
                    </span>
                    <div>
                      <span className="dashboard-stat-value">
                        {summary.latestWeight !== undefined ? `${summary.latestWeight}kg` : '—'}
                      </span>
                      <span className="dashboard-stat-label dashboard-weight-inline-label">
                        Weight
                        {summary.weightChange !== undefined && summary.weightChange !== 0 && (
                          <span
                            className={
                              'dashboard-weight-change' +
                              (summary.weightChange < 0
                                ? ' dashboard-weight-change-down'
                                : ' dashboard-weight-change-up')
                            }
                          >
                            {' '}
                            ({summary.weightChange > 0 ? '+' : ''}
                            {summary.weightChange}kg)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="weight-chart">
                    <svg
                      className="weight-chart-svg"
                      viewBox={`0 0 ${WEIGHT_CHART_WIDTH} ${WEIGHT_CHART_HEIGHT}`}
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="weight-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-orange-500)" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="var(--color-orange-500)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="25" x2={WEIGHT_CHART_WIDTH} y2="25" className="weight-chart-gridline" />
                      <line x1="0" y1="50" x2={WEIGHT_CHART_WIDTH} y2="50" className="weight-chart-gridline" />
                      <line x1="0" y1="75" x2={WEIGHT_CHART_WIDTH} y2="75" className="weight-chart-gridline" />
                      {summary.weightTrend.length >= 2 && (
                        <path d={buildWeightChartArea(summary.weightTrend)} className="weight-chart-fill" />
                      )}
                      {summary.weightTrend.length >= 2 ? (
                        <polyline
                          ref={weightPolylineRef}
                          points={buildWeightChartPoints(summary.weightTrend)}
                          className="weight-chart-line"
                        />
                      ) : (
                        <line
                          ref={weightEmptyLineRef}
                          x1="0"
                          y1={WEIGHT_CHART_HEIGHT / 2}
                          x2={WEIGHT_CHART_WIDTH}
                          y2={WEIGHT_CHART_HEIGHT / 2}
                          className="weight-chart-empty-line"
                        />
                      )}
                    </svg>
                    {summary.weightTrend.length < 2 && (
                      <span className="weight-chart-empty-note">Log your weight to start the trend</span>
                    )}
                  </div>
                </GlassCard>
              </div>

              <GlassCard variant="flat" className="dashboard-achievements">
                <h2>Achievements</h2>
                <AchievementBadges summary={summary} />
              </GlassCard>

              <DashboardCalendar />

              {mergedPersonalRecords.length > 0 && (
                <GlassCard variant="flat" className="dashboard-prs">
                  <h2>Recent Personal Records</h2>
                  <div className="pr-card-grid">
                    {mergedPersonalRecords.map((pr) => (
                      <div key={pr.exerciseId} className="pr-card">
                        <span className="pr-card-name">{pr.exerciseName}</span>
                        <div className="pr-card-stats">
                          {pr.weight !== undefined && (
                            <span className="pr-card-stat">
                              <span className="pr-card-stat-icon" aria-hidden="true">
                                <DumbbellIcon />
                              </span>
                              {pr.weight}kg
                            </span>
                          )}
                          {pr.reps !== undefined && (
                            <span className="pr-card-stat">
                              <span className="pr-card-stat-icon" aria-hidden="true">
                                <RepsIcon />
                              </span>
                              {pr.reps} reps
                            </span>
                          )}
                          <span className="pr-card-date">{formatRelativeDate(pr.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </Container>

      <Modal isOpen={isLogWeightOpen} onClose={() => setIsLogWeightOpen(false)} title="Log Weight">
        <Input
          label="Weight (kg)"
          type="number"
          min={0}
          value={weightInput}
          onChange={(event) => setWeightInput(event.target.value)}
        />
        {saveError && <p className="dashboard-error">{saveError}</p>}
        <div className="dashboard-log-weight-actions">
          <Button variant="ghost" onClick={() => setIsLogWeightOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLogWeight} loading={isSaving}>
            Save
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}