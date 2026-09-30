import { resolveMediaUrl } from '../../../../services/api/mediaUrl';
import type { ExerciseMediaFields } from '../../types';
import './ExerciseMedia.css';

interface ExerciseMediaProps {
  media: ExerciseMediaFields;
  alt: string;
  variant?: 'card' | 'detail';
}

export function ExerciseMedia({ media, alt, variant = 'card' }: ExerciseMediaProps) {
  const classNames = ['exercise-media', `exercise-media-${variant}`].join(' ');

  if (variant === 'detail' && media.video) {
    return (
      <div className={classNames}>
        <video className="exercise-media-video" src={resolveMediaUrl(media.video)!} controls />
      </div>
    );
  }

  const imageSrc = resolveMediaUrl(media.gif ?? media.image);
  if (imageSrc) {
    return (
      <div className={classNames}>
        <img className="exercise-media-image" src={imageSrc} alt={alt} loading="lazy" />
      </div>
    );
  }

  return (
    <div className={classNames}>
      <div className="exercise-media-placeholder" aria-hidden="true">
        <span className="exercise-media-placeholder-icon">🏋</span>
      </div>
    </div>
  );
}
