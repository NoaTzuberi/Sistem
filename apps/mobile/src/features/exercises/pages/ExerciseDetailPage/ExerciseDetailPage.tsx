import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AppShell } from '../../../../components/layout/AppShell/AppShell';
import { Modal } from '../../../../components/common/Modal/Modal';
import { Spinner } from '../../../../components/common/Spinner/Spinner';
import { Button } from '../../../../components/common/Button/Button';
import { ExerciseMedia } from '../../components/ExerciseMedia/ExerciseMedia';
import { getExerciseBySlug } from '../../../../services/exercises/exercisesService';
import { muscleLabel, equipmentLabel, muscleTagHue } from '../../data/filterOptions';
import { ROUTES } from '../../../../app/config/routes';
import type { PublicExercise } from '../../types';
import './ExerciseDetailPage.css';

const DIFFICULTY_LEVELS: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function hasInstructions(exercise: PublicExercise): boolean {
  return Boolean(
    exercise.instructions.setup || exercise.instructions.execution || exercise.instructions.breathing,
  );
}

export function ExerciseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;

  const [exercise, setExercise] = useState<PublicExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const data = await getExerciseBySlug(slug!);
        if (!cancelled) {
          setExercise(data);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
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
  }, [slug]);

  function handleClose() {
    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate(ROUTES.EXERCISES);
    }
  }

  let modalContent: ReactNode;

  if (isLoading) {
    modalContent = (
      <Modal isOpen onClose={handleClose} variant="flat" className="exercise-detail-modal">
        <div className="exercise-detail-loading">
          <Spinner size="lg" />
        </div>
      </Modal>
    );
  } else if (notFound || !exercise) {
    modalContent = (
      <Modal isOpen onClose={handleClose} variant="flat" className="exercise-detail-modal exercise-detail-modal-compact">
        <div className="exercise-detail-not-found">
          <h2>This exercise couldn&apos;t be found.</h2>
          <Button variant="secondary" onClick={handleClose}>
            Back to Exercise Library
          </Button>
        </div>
      </Modal>
    );
  } else {
    const showInstructions = hasInstructions(exercise);
    const showMistakes = exercise.commonMistakes.length > 0;
    const showTips = exercise.tips.length > 0;
    const showSparseNote = !showInstructions && !showMistakes && !showTips;
    const difficultyLevel = DIFFICULTY_LEVELS[exercise.difficulty] ?? 1;

    modalContent = (
      <Modal isOpen onClose={handleClose} variant="flat" className="exercise-detail-modal">
        <ExerciseMedia media={exercise.media} alt={exercise.name} variant="detail" />

        <h1 className="exercise-detail-name">{exercise.name}</h1>

        <div className="exercise-detail-tags">
          {exercise.primaryMuscles.map((muscle) => (
            <span key={muscle} className={`exercise-detail-tag exercise-detail-tag-${muscleTagHue(muscle)}`}>
              {muscleLabel(muscle)}
            </span>
          ))}
          {exercise.equipment.map((item) => (
            <span key={item} className="exercise-detail-tag-equipment">
              {equipmentLabel(item)}
            </span>
          ))}
        </div>

        <div className="exercise-detail-difficulty">
          <span className="exercise-detail-difficulty-label">{exercise.difficulty}</span>
          <div className="exercise-detail-difficulty-bars">
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`exercise-detail-difficulty-bar${level <= difficultyLevel ? ' is-filled' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="exercise-detail-scroll-hint" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M4 7L10 13L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {showInstructions && (
          <section className="exercise-detail-section">
            <h2>Instructions</h2>
            {exercise.instructions.setup && <p className="text-body">{exercise.instructions.setup}</p>}
            {exercise.instructions.execution && (
              <p className="text-body exercise-detail-execution">{exercise.instructions.execution}</p>
            )}
            {exercise.instructions.breathing && (
              <p className="text-body">{exercise.instructions.breathing}</p>
            )}
          </section>
        )}

        {showMistakes && (
          <section className="exercise-detail-section">
            <h2>Common Mistakes</h2>
            <ul>
              {exercise.commonMistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </section>
        )}

        {showTips && (
          <section className="exercise-detail-section">
            <h2>Tips</h2>
            <ul>
              {exercise.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        )}

        {showSparseNote && (
          <p className="text-body exercise-detail-sparse-note">
            Detailed instructions for this exercise haven&apos;t been added yet.
          </p>
        )}
      </Modal>
    );
  }

  return backgroundLocation ? modalContent : <AppShell>{modalContent}</AppShell>;
}