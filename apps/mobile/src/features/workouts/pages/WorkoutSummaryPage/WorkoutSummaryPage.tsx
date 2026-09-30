import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { Button } from '../../../../components/common/Button/Button';
import { getWorkoutById } from '../../../../services/workouts/workoutSessionService';
import { ROUTES } from '../../../../app/config/routes';
import { useStaggerReveal } from '../../../../hooks/useStaggerReveal';
import type { WorkoutSession, NewPersonalRecord } from '../../types';
import './WorkoutSummaryPage.css';

function formatDuration(minutes?: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function WorkoutSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const newPersonalRecords = (location.state as { newPersonalRecords?: NewPersonalRecord[] } | null)
    ?.newPersonalRecords ?? [];

  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const statsRef = useStaggerReveal<HTMLDivElement>([workout]);
  const prListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workout || newPersonalRecords.length === 0) return;
    const container = prListRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = Array.from(container.children) as HTMLElement[];
    const badges = container.querySelectorAll<HTMLElement>('.workout-summary-pr-badge');

    const timeline = gsap.timeline();
    timeline.fromTo(
      rows,
      { opacity: 0, y: 14, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', stagger: 0.12 },
    );
    timeline.fromTo(
      badges,
      { boxShadow: '0 0 0 0 rgba(217, 162, 76, 0)' },
      {
        boxShadow: '0 0 0 6px rgba(217, 162, 76, 0.28)',
        duration: 0.35,
        ease: 'power2.out',
        stagger: 0.12,
        yoyo: true,
        repeat: 1,
      },
      '-=0.3',
    );

    return () => {
      timeline.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, newPersonalRecords.length]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getWorkoutById(id!);
        if (!cancelled) setWorkout(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Couldn't load this workout summary.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <AppShell>
        <Section>
          <Container>
            <div className="workout-summary-loading">
              <Spinner size="lg" />
            </div>
          </Container>
        </Section>
      </AppShell>
    );
  }

  if (loadError || !workout) {
    return (
      <AppShell>
        <Section>
          <Container>
            <p className="workout-summary-error">{loadError ?? "This workout couldn't be found."}</p>
          </Container>
        </Section>
      </AppShell>
    );
  }

  const completedSets = workout.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <AppShell>
      <Section className="workout-summary-page">
        <Container>
          <h1 className="workout-summary-title">{workout.name} — Complete</h1>

          <div className="workout-summary-stats" ref={statsRef}>
            <GlassCard className="workout-summary-stat">
              <span className="workout-summary-stat-value">{formatDuration(workout.duration)}</span>
              <span className="workout-summary-stat-label">Duration</span>
            </GlassCard>
            <GlassCard className="workout-summary-stat">
              <span className="workout-summary-stat-value">{workout.totalVolume ?? 0} kg</span>
              <span className="workout-summary-stat-label">Volume</span>
            </GlassCard>
            <GlassCard className="workout-summary-stat">
              <span className="workout-summary-stat-value">{completedSets}</span>
              <span className="workout-summary-stat-label">Sets Completed</span>
            </GlassCard>
          </div>

          {newPersonalRecords.length > 0 && (
            <GlassCard className="workout-summary-prs">
              <h2>New Personal Records</h2>
              <div className="workout-summary-pr-list" ref={prListRef}>
                {newPersonalRecords.map((pr, index) => (
                  <div key={`${pr.exerciseId}-${pr.type}-${index}`} className="workout-summary-pr">
                    <span className="workout-summary-pr-badge">PR</span>
                    <span>
                      {pr.exerciseName} — {pr.type === 'weight' ? `${pr.newValue}kg` : `${pr.newValue} reps`}
                      {pr.previousValue > 0 &&
                        ` (up from ${pr.type === 'weight' ? `${pr.previousValue}kg` : `${pr.previousValue} reps`})`}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {workout.notes && (
            <GlassCard className="workout-summary-notes">
              <h2>Notes</h2>
              <p className="text-body">{workout.notes}</p>
            </GlassCard>
          )}

          <Button onClick={() => navigate(ROUTES.WORKOUTS)}>Done</Button>
        </Container>
      </Section>
    </AppShell>
  );
}
