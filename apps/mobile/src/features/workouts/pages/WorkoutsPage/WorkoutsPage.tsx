import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { Button } from '../../../../components/common/Button/Button';
import { WorkoutChip } from '../../components/WorkoutChip/WorkoutChip';
import { TemplateCard } from '../../components/TemplateCard/TemplateCard';
import { FeaturedWorkoutCard } from '../../components/FeaturedWorkoutCard/FeaturedWorkoutCard';
import { WORKOUT_CATEGORY_OPTIONS } from '../../data/workoutOptions';
import { getCategoryIcon } from '../../data/categoryVisuals';
import { getRecommendedTemplate } from '../../data/recommendation';
import { listWorkoutTemplates } from '../../../../services/workouts/workoutTemplatesService';
import { getActiveWorkout, listWorkouts } from '../../../../services/workouts/workoutSessionService';
import { getMyProfile } from '../../../../services/users/usersService';
import { ROUTES, workoutSessionPath } from '../../../../app/config/routes';
import { useStaggerReveal } from '../../../../hooks/useStaggerReveal';
import type { WorkoutCategory, WorkoutTemplate, WorkoutSession, WorkoutSummary } from '../../types';
import './WorkoutsPage.css';

// `error instanceof Error` is true for AxiosError too, so it can't tell a raw
// transport failure (e.g. "Network Error") apart from an intentional backend
// message — only trust a message the backend actually sent, and fall back to
// a friendly one otherwise.
function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  return fallback;
}

export function WorkoutsPage() {
  const [category, setCategory] = useState<WorkoutCategory | undefined>(undefined);
  const [mineOnly, setMineOnly] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [completionCounts, setCompletionCounts] = useState<Map<string, number>>(new Map());
  const [completedSessions, setCompletedSessions] = useState<WorkoutSummary[]>([]);
  const [allTemplates, setAllTemplates] = useState<WorkoutTemplate[]>([]);
  const [onboardingGoals, setOnboardingGoals] = useState<string[]>();
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(true);
  const gridRef = useStaggerReveal<HTMLDivElement>([templates]);

  useEffect(() => {
    getActiveWorkout().then(setActiveWorkout);

    const sessionsPromise = listWorkouts({ status: 'completed' }).then((sessions) => {
      const counts = new Map<string, number>();
      for (const session of sessions) {
        if (!session.templateId) continue;
        counts.set(session.templateId, (counts.get(session.templateId) ?? 0) + 1);
      }
      setCompletionCounts(counts);
      setCompletedSessions(sessions);
    });

    const templatesPromise = listWorkoutTemplates({}).then(setAllTemplates);

    const profilePromise = getMyProfile()
      .then((profile) => setOnboardingGoals(profile.profile?.goals))
      .catch(() => {
        // Featured section just falls back to "recently added" — not worth surfacing an error for this.
      });

    // The featured card depends on all three of these, but none of them are
    // reflected in the grid's own `isLoading` — without this, the card used
    // to pop in over whatever was already painted (including bare AppShell
    // background) the moment these resolved, rather than reserving its own
    // space from first paint like the rest of the page's loading states do.
    Promise.all([sessionsPromise, templatesPromise, profilePromise]).finally(() => {
      setIsRecommendationLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(undefined);
      try {
        const data = await listWorkoutTemplates({ category, mine: mineOnly });
        if (!cancelled) setTemplates(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(extractErrorMessage(error, "Couldn't load workouts. Please try again."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category, mineOnly]);

  const recommended = getRecommendedTemplate(allTemplates, onboardingGoals, completedSessions);

  return (
    <AppShell>
      <Section className="workouts-page">
        <Container>
          <div className="workouts-page-actions-row">
            <Link to={ROUTES.WORKOUT_BUILDER}>
              <Button>Create Workout</Button>
            </Link>
          </div>

          {activeWorkout && (
            <GlassCard className="workouts-page-resume-banner">
              <span>Workout in progress: {activeWorkout.name}</span>
              <Link to={workoutSessionPath(activeWorkout.id)}>
                <Button variant="secondary">Resume</Button>
              </Link>
            </GlassCard>
          )}

          {isRecommendationLoading && (
            <div className="workouts-page-featured workouts-page-featured-loading">
              <Spinner size="lg" />
            </div>
          )}

          {!isRecommendationLoading && recommended && (
            <div className="workouts-page-featured">
              <FeaturedWorkoutCard
                template={recommended.template}
                reason={recommended.reason}
                isPersonalized={recommended.isPersonalized}
              />
            </div>
          )}

          <div className="workouts-page-toolbar">
            <div className="workouts-page-chips">
              <WorkoutChip
                label="All"
                selected={category === undefined}
                onClick={() => setCategory(undefined)}
              />
              {WORKOUT_CATEGORY_OPTIONS.map((option) => {
                const Icon = getCategoryIcon(option.value);
                return (
                  <WorkoutChip
                    key={option.value}
                    label={option.label}
                    icon={<Icon />}
                    selected={category === option.value}
                    onClick={() => setCategory(category === option.value ? undefined : option.value)}
                  />
                );
              })}
            </div>
            <WorkoutChip label="My Workouts" selected={mineOnly} onClick={() => setMineOnly((v) => !v)} />
          </div>

          {isLoading && (
            <div className="workouts-page-loading">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && loadError && <p className="workouts-page-error">{loadError}</p>}

          {!isLoading && !loadError && templates.length === 0 && (
            <GlassCard className="workouts-page-empty" variant='flat'>
              <h2>
                {mineOnly
                  ? "You haven't created any workouts yet."
                  : category
                    ? 'No workouts found in this category yet.'
                    : 'No workouts match this filter.'}
              </h2>
              <Link to={ROUTES.WORKOUT_BUILDER}>
                <Button>Create Workout</Button>
              </Link>
            </GlassCard>
          )}

          {!isLoading && !loadError && templates.length > 0 && (
            <div className="workouts-page-grid" ref={gridRef}>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  completionCount={completionCounts.get(template.id)}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </AppShell>
  );
}
