import { Link, useLocation } from 'react-router-dom';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { ExerciseMedia } from '../ExerciseMedia/ExerciseMedia';
import { muscleLabel, equipmentLabel, equipmentIcon, muscleTagHue } from '../../data/filterOptions';
import { exercisePath } from '../../../../app/config/routes';
import type { PublicExercise } from '../../types';
import './ExerciseCard.css';

const MAX_VISIBLE_EQUIPMENT_TAGS = 2;

const DIFFICULTY_LEVELS: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

interface ExerciseCardProps {
  exercise: PublicExercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const location = useLocation();
  const primaryMuscle = exercise.primaryMuscles[0];
  const equipmentTags = exercise.equipment.slice(0, MAX_VISIBLE_EQUIPMENT_TAGS);
  const extraEquipmentCount = exercise.equipment.length - equipmentTags.length;
  const difficultyLevel = DIFFICULTY_LEVELS[exercise.difficulty] ?? 1;

  return (
    <Link
      to={exercisePath(exercise.slug)}
      state={{ backgroundLocation: location }}
      className="exercise-card-link"
    >
      <GlassCard className="exercise-card" variant='flat'>
        <div className="exercise-card-media-wrap">
          <ExerciseMedia media={exercise.media} alt={exercise.name} variant="card" />
        </div>
        <div className="exercise-card-body">
          <div className="exercise-card-title">
            <div className="exercise-card-name-row">
              <span className="exercise-card-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="exercise-card-title">
                <h3 className="exercise-card-name">{exercise.name}</h3>
                <span className="exercise-card-underline" />
              </div>
            </div>
          </div>
          <div className="exercise-card-tags">
            {primaryMuscle && (
              <span className={`exercise-card-muscle-tag exercise-card-muscle-tag-${muscleTagHue(primaryMuscle)}`}>
                {muscleLabel(primaryMuscle)}
              </span>
            )}
            {equipmentTags.map((tag) => {
              const Icon = equipmentIcon(tag);
              return (
                <span key={`equipment-${tag}`} className="exercise-card-equipment-tag">
                  {Icon && (
                    <span className="exercise-card-equipment-icon" aria-hidden="true">
                      <Icon />
                    </span>
                  )}
                  {equipmentLabel(tag)}
                </span>
              );
            })}
            {extraEquipmentCount > 0 && (
              <span className="exercise-card-equipment-tag">+{extraEquipmentCount} more</span>
            )}
          </div>
          <div className="exercise-card-difficulty">
            <span className="exercise-card-difficulty-label">{exercise.difficulty}</span>
            <div className="exercise-card-difficulty-bars">
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className={`exercise-card-difficulty-bar${level <= difficultyLevel ? ' is-filled' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}