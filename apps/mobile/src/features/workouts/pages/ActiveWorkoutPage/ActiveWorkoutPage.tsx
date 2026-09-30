import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { Button } from '../../../../components/common/Button/Button';
import { Modal } from '../../../../components/common/Modal/Modal';
import { ExerciseMedia } from '../../../exercises/components/ExerciseMedia/ExerciseMedia';
import {
  getWorkoutById,
  updateWorkoutProgress,
  abandonWorkout,
  finishWorkout,
} from '../../../../services/workouts/workoutSessionService';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { ROUTES, workoutSessionSummaryPath } from '../../../../app/config/routes';
import type { WorkoutSession, WorkoutSessionExercise, WorkoutSet } from '../../types';
import './ActiveWorkoutPage.css';

const PROGRESS_SAVE_DEBOUNCE_MS = 800;

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function isExerciseComplete(entry: WorkoutSessionExercise): boolean {
  return entry.sets.length > 0 && entry.sets.every((s) => s.completed);
}

function findFirstIncompleteIndex(exercises: WorkoutSessionExercise[]): number {
  const index = exercises.findIndex((e) => !isExerciseComplete(e));
  return index === -1 ? Math.max(0, exercises.length - 1) : index;
}
interface SetStepperProps {
  value: number;
  step: number;
  min?: number;
  allowDecimal?: boolean;
  onChange: (value: number) => void;
  ariaLabel: string;
}

function SetStepper({ value, step, min = 0, allowDecimal = false, onChange, ariaLabel }: SetStepperProps) {
  const [draft, setDraft] = useState(formatSetValue(value));

  useEffect(() => {
    setDraft(formatSetValue(value));
  }, [value]);

  const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;

  function decrement() {
    onChange(Math.max(min, roundToStep(value - step, step)));
  }
  function increment() {
    onChange(roundToStep(value + step, step));
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (next !== '' && !pattern.test(next)) return;
    setDraft(next);

    if (next !== '' && !next.endsWith('.')) {
      const parsed = Number(next);
      if (!Number.isNaN(parsed)) onChange(parsed);
    }
  }

  function handleBlur() {
    const parsed = Number(draft);
    if (draft === '' || Number.isNaN(parsed)) {
      setDraft(formatSetValue(value));
    } else {
      const clamped = Math.max(min, parsed);
      onChange(clamped);
      setDraft(formatSetValue(clamped));
    }
  }

  return (
    <div className="active-workout-stepper" role="group" aria-label={ariaLabel}>
      <button type="button" className="active-workout-stepper-button" onClick={decrement} aria-label="Decrease">
        −
      </button>
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        className="active-workout-stepper-input"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={ariaLabel}
      />
      <button type="button" className="active-workout-stepper-button" onClick={increment} aria-label="Increase">
        +
      </button>
    </div>
  );
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatSetValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function ActiveWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutSessionExercise[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getWorkoutById(id!);
        if (cancelled) return;

        if (data.status === 'completed') {
          navigate(workoutSessionSummaryPath(data.id), { replace: true });
          return;
        }
        if (data.status === 'abandoned') {
          navigate(ROUTES.WORKOUTS, { replace: true });
          return;
        }

        setWorkout(data);
        setExercises(data.exercises);
        setActiveExerciseIndex(findFirstIncompleteIndex(data.exercises));
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Couldn't load this workout.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!workout || isPaused) return;
    const startedAt = new Date(workout.createdAt).getTime();

    function tick() {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [workout, isPaused]);

  const debouncedExercises = useDebouncedValue(exercises, PROGRESS_SAVE_DEBOUNCE_MS);

  useEffect(() => {
    if (!id || debouncedExercises.length === 0) return;
    updateWorkoutProgress(
      id,
      debouncedExercises.map((e) => ({ exerciseId: e.exercise.id, sets: e.sets })),
    );
    // Only re-run when the debounced snapshot itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedExercises, id]);

  function updateSet(exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSet>) {
    setExercises((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? { ...entry, sets: entry.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) }
          : entry,
      ),
    );
  }

  function addSet(exerciseIndex: number) {
    setExercises((prev) =>
      prev.map((entry, i) => {
        if (i !== exerciseIndex) return entry;
        const last = entry.sets[entry.sets.length - 1];
        return {
          ...entry,
          sets: [
            ...entry.sets,
            {
              setNumber: entry.sets.length + 1,
              weight: last?.weight ?? 0,
              reps: last?.reps ?? 0,
              completed: false,
            },
          ],
        };
      }),
    );
  }

  const totalSets = useMemo(() => exercises.reduce((sum, e) => sum + e.sets.length, 0), [exercises]);
  const completedSets = useMemo(
    () => exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0),
    [exercises],
  );

  async function handleFinish() {
    if (!id) return;
    setIsFinishing(true);
    try {
      await updateWorkoutProgress(
        id,
        exercises.map((e) => ({ exerciseId: e.exercise.id, sets: e.sets })),
      );
      const result = await finishWorkout(id, { rating, notes: notes.trim() || undefined });
      navigate(workoutSessionSummaryPath(id), { state: { newPersonalRecords: result.newPersonalRecords } });
    } finally {
      setIsFinishing(false);
    }
  }

  async function handleCancel() {
    if (!id) return;
    setIsCancelling(true);
    try {
      await abandonWorkout(id);
      navigate(ROUTES.WORKOUTS);
    } finally {
      setIsCancelling(false);
    }
  }

  function handleExitClick() {
    setShowExitConfirm(true);
  }

  if (isLoading) {
    return (
      <AppShell>
        <Section>
          <Container>
            <div className="active-workout-loading">
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
            <p className="active-workout-error">{loadError ?? "This workout couldn't be found."}</p>
          </Container>
        </Section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="active-workout-header">
        <div className="active-workout-header-info">
          <span className="active-workout-title">{workout.name}</span>
          <span className="active-workout-progress">
            {completedSets} / {totalSets} sets complete
          </span>
        </div>
        <div className="active-workout-header-controls">
          <span className="active-workout-timer">{formatElapsed(elapsedSeconds)}</span>
          <button
            type="button"
            className="active-workout-header-button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶' : '❚❚'}
          </button>
          <button
            type="button"
            className="active-workout-header-button active-workout-header-button-danger"
            onClick={handleExitClick}
            disabled={isCancelling}
            aria-label="Exit workout"
            title="Exit workout"
          >
            ✕
          </button>
        </div>
      </div>

      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        variant="flat"
        className="active-workout-exit-modal"
        title="End this workout?"
      >
        <p className="active-workout-exit-detail">Your progress won't be saved if you leave now.</p>
        <div className="active-workout-exit-actions">
          <Button variant="ghost" onClick={() => setShowExitConfirm(false)} disabled={isCancelling}>
            Continue Workout
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={isCancelling}>
            End Workout
          </Button>
        </div>
      </Modal>

      <Section className="active-workout-page">
        <Container>
          <div className="active-workout-exercises">
            {exercises.map((entry, exerciseIndex) => {
              const isActive = exerciseIndex === activeExerciseIndex;
              const isComplete = isExerciseComplete(entry);
              const isNext = !isActive && exerciseIndex === activeExerciseIndex + 1;
              const completedInEntry = entry.sets.filter((s) => s.completed).length;

              if (!isActive) {
                return (
                  <button
                    key={entry.exercise.id}
                    type="button"
                    className="active-workout-exercise-collapsed"
                    onClick={() => setActiveExerciseIndex(exerciseIndex)}
                  >
                    <span
                      className={
                        'active-workout-exercise-tag' +
                        (isComplete ? ' active-workout-exercise-tag-done' : '') +
                        (isNext ? ' active-workout-exercise-tag-next' : '')
                      }
                    >
                      {isComplete ? 'done' : isNext ? 'next' : ''}
                    </span>
                    <span className="active-workout-exercise-collapsed-name">{entry.exercise.name}</span>
                    <span className="active-workout-exercise-collapsed-count">
                      {completedInEntry}/{entry.sets.length}
                    </span>
                  </button>
                );
              }

              return (
                <div key={entry.exercise.id} className="active-workout-exercise-card">
                  <div className="active-workout-exercise-header">
                    <span className="active-workout-exercise-tag active-workout-exercise-tag-now">now</span>
                    <div className="active-workout-exercise-media">
                      <ExerciseMedia media={entry.exercise.media} alt={entry.exercise.name} variant="card" />
                    </div>
                    <h2 className="active-workout-exercise-name">{entry.exercise.name}</h2>
                  </div>

                  <div className="active-workout-sets">
                    <div className="active-workout-set-row active-workout-set-row-header">
                      <span>Set</span>
                      <span>Weight (kg)</span>
                      <span>Reps</span>
                      <span>Done</span>
                    </div>
                    {entry.sets.map((set, setIndex) => (
                      <div
                        key={set.setNumber}
                        className={'active-workout-set-row' + (set.completed ? ' active-workout-set-row-done' : '')}
                      >
                        <span className="active-workout-set-number">{set.setNumber}</span>
                        <SetStepper
                          value={set.weight}
                          step={2.5}
                          onChange={(weight) => updateSet(exerciseIndex, setIndex, { weight })}
                          ariaLabel={`Weight for set ${set.setNumber}`}
                        />
                        <SetStepper
                          value={set.reps}
                          step={1}
                          onChange={(reps) => updateSet(exerciseIndex, setIndex, { reps })}
                          ariaLabel={`Reps for set ${set.setNumber}`}
                        />
                        <button
                          type="button"
                          className={
                            'active-workout-set-check' + (set.completed ? ' active-workout-set-check-done' : '')
                          }
                          onClick={() => updateSet(exerciseIndex, setIndex, { completed: !set.completed })}
                          aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
                        >
                          {set.completed ? '✓' : ''}
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button variant="ghost" onClick={() => addSet(exerciseIndex)}>
                    + Add Set
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="active-workout-wrapup">
            <h2>How did it feel?</h2>
            <div className="active-workout-rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={'active-workout-rating-star' + (rating && value <= rating ? ' active-workout-rating-star-selected' : '')}
                  onClick={() => setRating(value === rating ? undefined : value)}
                  aria-label={`Rate ${value} out of 5`}
                >
                  &#9733;
                </button>
              ))}
            </div>
            <textarea
              className="active-workout-notes"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>

          <div className="active-workout-actions">
            <Button variant="ghost" onClick={handleCancel} loading={isCancelling}>
              Cancel Workout
            </Button>
            <Button onClick={handleFinish} loading={isFinishing}>
              Finish Workout
            </Button>
          </div>
        </Container>
      </Section>
    </AppShell>
  );
}