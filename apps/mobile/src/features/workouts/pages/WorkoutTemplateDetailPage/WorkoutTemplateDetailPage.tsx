import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Modal } from '../../../../components/common/Modal/Modal';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { Button } from '../../../../components/common/Button/Button';
import { CategoryBadge } from '../../components/CategoryBadge/CategoryBadge';
import { ExerciseMedia } from '../../../exercises/components/ExerciseMedia/ExerciseMedia';
import { muscleLabel, equipmentLabel, muscleTagHue } from '../../../exercises/data/filterOptions';
import { workoutGoalLabel } from '../../data/workoutOptions';
import { getWorkoutTemplateById, deleteWorkoutTemplate } from '../../../../services/workouts/workoutTemplatesService';
import { startWorkout } from '../../../../services/workouts/workoutSessionService';
import { ROUTES, workoutEditPath, workoutSessionPath } from '../../../../app/config/routes';
import type { WorkoutTemplate } from '../../types';
import './WorkoutTemplateDetailPage.css';

export function WorkoutTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const data = await getWorkoutTemplateById(id!);
        if (!cancelled) setTemplate(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleClose() {
    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate(ROUTES.WORKOUTS);
    }
  }

  async function handleStart() {
    if (!id) return;
    setIsStarting(true);
    try {
      const session = await startWorkout(id);
      navigate(workoutSessionPath(session.id));
    } finally {
      setIsStarting(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWorkoutTemplate(id!);
      handleClose();
    } finally {
      setIsDeleting(false);
    }
  }

  let modalContent: ReactNode;

  if (isLoading) {
    modalContent = (
      <Modal isOpen onClose={handleClose} variant="flat" className="workout-detail-modal">
        <div className="workout-detail-loading">
          <Spinner size="lg" />
        </div>
      </Modal>
    );
  } else if (notFound || !template) {
    modalContent = (
      <Modal isOpen onClose={handleClose} variant="flat" className="workout-detail-modal workout-detail-modal-compact">
        <div className="workout-detail-not-found">
          <h2>This workout couldn&apos;t be found.</h2>
          <Button variant="secondary" onClick={handleClose}>
            Back to Workouts
          </Button>
        </div>
      </Modal>
    );
  } else {
    modalContent = (
      <Modal isOpen onClose={handleClose} variant="flat" className="workout-detail-modal">
        <h1 className="workout-detail-name">{template.name}</h1>
        <span className="workout-detail-underline" />

        <div className="workout-detail-tags">
          {template.category && <CategoryBadge category={template.category} />}
          {template.difficulty && <span className="workout-detail-tag">{template.difficulty}</span>}
          {template.goal.map((g) => (
            <span key={g} className="workout-detail-tag">
              {workoutGoalLabel(g)}
            </span>
          ))}
          {template.duration && <span className="workout-detail-tag">{template.duration} min</span>}
        </div>

        {template.description && <p className="text-body workout-detail-description">{template.description}</p>}

        <Button onClick={handleStart} loading={isStarting} className="workout-detail-start-button">
          Start Workout
        </Button>

        <div className="workout-detail-exercises">
          {template.exercises.map((entry) => (
            <div key={entry.exercise.id} className="workout-detail-exercise">
              <div className="workout-detail-exercise-media">
                <ExerciseMedia media={entry.exercise.media} alt={entry.exercise.name} variant="card" />
              </div>
              <div className="workout-detail-exercise-info">
                <span className="workout-detail-exercise-name">{entry.exercise.name}</span>
                <div className="workout-detail-exercise-tags">
                  {entry.exercise.primaryMuscles.map((muscle) => (
                    <span
                      key={muscle}
                      className={`workout-detail-exercise-tag workout-detail-exercise-tag-${muscleTagHue(muscle)}`}
                    >
                      {muscleLabel(muscle)}
                    </span>
                  ))}
                  {entry.exercise.equipment.map((item) => (
                    <span key={item} className="workout-detail-exercise-tag-equipment">
                      {equipmentLabel(item)}
                    </span>
                  ))}
                </div>
                <span className="workout-detail-exercise-scheme text-caption">
                  {entry.defaultSets} sets &times; {entry.defaultReps}
                  {entry.defaultWeight !== undefined ? ` @ ${entry.defaultWeight}kg` : ''}
                  {entry.restTime !== undefined ? ` — ${entry.restTime}s rest` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        {template.isOwner && (
          <div className="workout-detail-actions">
            <Button variant="ghost" onClick={() => navigate(workoutEditPath(template.id))}>
              Edit
            </Button>
            <Button variant="ghost" onClick={handleDelete} loading={isDeleting}>
              {confirmingDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
          </div>
        )}
      </Modal>
    );
  }

  return backgroundLocation ? modalContent : <AppShell>{modalContent}</AppShell>;
}