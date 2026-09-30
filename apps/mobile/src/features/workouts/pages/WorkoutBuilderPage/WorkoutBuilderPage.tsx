import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Button } from '../../../../components/common/Button/Button';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { OnboardingProgress } from '../../../onboarding/components/OnboardingProgress/OnboardingProgress';
import { WorkoutSummaryCard } from '../../components/WorkoutSummaryCard/WorkoutSummaryCard';
import { MuscleCoverageMap } from '../../components/MuscleCoverageMap/MuscleCoverageMap';
import { BasicsStep } from '../../steps/BasicsStep/BasicsStep';
import { GoalCategoryStep } from '../../steps/GoalCategoryStep/GoalCategoryStep';
import { AddExercisesStep } from '../../steps/AddExercisesStep/AddExercisesStep';
import { ReviewWorkoutStep } from '../../steps/ReviewWorkoutStep/ReviewWorkoutStep';
import type { WorkoutExerciseRowValue } from '../../components/WorkoutExerciseRow/WorkoutExerciseRow';
import { BasicInfoIcon, AddExercisesIcon } from '../../components/icons';
import {
  getWorkoutTemplateById,
  createWorkoutTemplate,
  updateWorkoutTemplate,
} from '../../../../services/workouts/workoutTemplatesService';
import { getExerciseHistory } from '../../../../services/workouts/workoutSessionService';
import { ROUTES, workoutTemplatePath } from '../../../../app/config/routes';
import { useStaggerReveal } from '../../../../hooks/useStaggerReveal';
import type { WorkoutCategory, WorkoutGoal } from '../../types';
import type { Difficulty } from '../../../exercises/types';
import './WorkoutBuilderPage.css';

const STEP_COUNT = 2;
const STEP_TITLES = ['Details', 'Exercises'];
const STEP_ICONS = [BasicInfoIcon, AddExercisesIcon];

export function WorkoutBuilderPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [stepIndex, setStepIndex] = useState(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WorkoutCategory | ''>('');
  const [goal, setGoal] = useState<WorkoutGoal[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [duration, setDuration] = useState<string>('');
  const [rows, setRows] = useState<WorkoutExerciseRowValue[]>([]);
  const layoutRef = useStaggerReveal<HTMLDivElement>([isLoading]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const template = await getWorkoutTemplateById(id!);
        if (cancelled) return;
        setName(template.name);
        setDescription(template.description);
        setCategory(template.category ?? '');
        setGoal(template.goal);
        setDifficulty(template.difficulty ?? '');
        setDuration(template.duration ? String(template.duration) : '');
        setRows(
          template.exercises.map((entry) => ({
            exercise: entry.exercise,
            defaultSets: entry.defaultSets,
            defaultReps: entry.defaultReps,
            defaultWeight: entry.defaultWeight,
            restTime: entry.restTime,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Couldn't load this workout.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function toggleGoal(value: WorkoutGoal) {
    setGoal((prev) => (prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]));
  }

  function buildDefaultRow(exercise: WorkoutExerciseRowValue['exercise']): WorkoutExerciseRowValue {
    return { exercise, defaultSets: 3, defaultReps: '10', restTime: 60 };
  }

  function applyExerciseHistory(exerciseId: string) {
    getExerciseHistory(exerciseId)
      .then((history) => {
        if (!history) return;
        setRows((prev) =>
          prev.map((row) =>
            row.exercise.id === exerciseId
              ? {
                  ...row,
                  defaultSets: history.sets,
                  defaultReps: String(history.reps),
                  defaultWeight: history.weight > 0 ? history.weight : row.defaultWeight,
                  lastLogged: { sets: history.sets, reps: history.reps, weight: history.weight },
                }
              : row,
          ),
        );
      })
      .catch(() => {
        // No history available (or the lookup failed) — keep the generic defaults.
      });
  }

  function addExercise(exercise: WorkoutExerciseRowValue['exercise']) {
    setRows((prev) => [...prev, buildDefaultRow(exercise)]);
    applyExerciseHistory(exercise.id);
  }

  function toggleExercise(exercise: WorkoutExerciseRowValue['exercise']) {
    const alreadyAdded = rows.some((row) => row.exercise.id === exercise.id);
    setRows((prev) =>
      alreadyAdded
        ? prev.filter((row) => row.exercise.id !== exercise.id)
        : [...prev, buildDefaultRow(exercise)],
    );
    if (!alreadyAdded) {
      applyExerciseHistory(exercise.id);
    }
  }

  function updateRow(index: number, patch: Partial<WorkoutExerciseRowValue>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function moveRow(index: number, direction: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function isStepValid(index: number): boolean {
    switch (index) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return rows.length > 0;
      default:
        return true;
    }
  }

  function handleBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function handleContinue() {
    if (stepIndex === STEP_COUNT - 1) {
      handleSave();
      return;
    }
    setStepIndex((index) => index + 1);
  }

  async function handleSave() {
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (rows.length === 0) {
      setFormError('Add at least one exercise.');
      return;
    }

    setFormError(undefined);
    setIsSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      goal,
      difficulty: difficulty || undefined,
      duration: duration ? Number(duration) : undefined,
      category: category || undefined,
      exercises: rows.map((row, index) => ({
        exerciseId: row.exercise.id,
        order: index + 1,
        defaultSets: row.defaultSets,
        defaultReps: row.defaultReps,
        defaultWeight: row.defaultWeight,
        restTime: row.restTime,
      })),
    };

    try {
      const saved = id ? await updateWorkoutTemplate(id, payload) : await createWorkoutTemplate(payload);
      navigate(workoutTemplatePath(saved.id));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Couldn't save this workout.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <Section>
          <Container>
            <div className="workout-builder-loading">
              <Spinner size="lg" />
            </div>
          </Container>
        </Section>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <Section>
          <Container>
            <p className="workout-builder-error">{loadError}</p>
          </Container>
        </Section>
      </AppShell>
    );
  }

  const addedExerciseIds = new Set(rows.map((row) => row.exercise.id));
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEP_COUNT - 1;
  const StepIcon = STEP_ICONS[stepIndex];
  const showSidePanel = rows.length > 0;

  const steps = [
    <div className="workout-builder-step-group" key="details">
      <BasicsStep
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        duration={duration}
        onDurationChange={setDuration}
      />
      <div className="workout-builder-step-divider" />
      <GoalCategoryStep
        category={category}
        onCategoryChange={setCategory}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        goal={goal}
        onToggleGoal={toggleGoal}
      />
    </div>,
    <div className="workout-builder-step-group" key="exercises">
      <AddExercisesStep
        addedExerciseIds={addedExerciseIds}
        onAdd={addExercise}
        onToggle={toggleExercise}
        rows={rows}
        onChangeRow={updateRow}
        onMoveRow={moveRow}
        onRemoveRow={removeRow}
      />
      <div className="workout-builder-step-divider" />
      <ReviewWorkoutStep
        name={name}
        description={description}
        category={category}
        difficulty={difficulty}
        duration={duration}
        goal={goal}
        rows={rows}
      />
    </div>,
  ];

  return (
    <AppShell>
      <Section className="workout-builder-page">
        <Container>
          <h1 className="workout-builder-title">{isEditMode ? 'Edit Workout' : 'Create Workout'}</h1>

          <div className="workout-builder-layout" ref={layoutRef}>
            <div className="workout-builder-main">
              <GlassCard className="workout-builder-panel" variant="flat">
                <div className="workout-builder-panel-header">
                  <span className="workout-builder-panel-icon" aria-hidden="true">
                    <StepIcon />
                  </span>
                  <h2>{STEP_TITLES[stepIndex]}</h2>
                  <OnboardingProgress currentStep={stepIndex + 1} totalSteps={STEP_COUNT} />
                </div>

                {steps[stepIndex]}

                {formError && <p className="workout-builder-error">{formError}</p>}

                <div className="workout-builder-step-nav">
                  {!isFirstStep && (
                    <Button variant="secondary" onClick={handleBack} disabled={isSaving}>
                      Back
                    </Button>
                  )}
                  <div className="workout-builder-nav-spacer" />
                  <Button variant="ghost" onClick={() => navigate(ROUTES.WORKOUTS)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleContinue} loading={isSaving} disabled={!isStepValid(stepIndex)}>
                    {isLastStep ? 'Save Workout' : 'Continue'}
                  </Button>
                </div>
              </GlassCard>
            </div>

            {showSidePanel && (
              <div className="workout-builder-side">
                <WorkoutSummaryCard rows={rows} />
                <MuscleCoverageMap rows={rows} />
              </div>
            )}
          </div>
        </Container>
      </Section>
    </AppShell>
  );
}