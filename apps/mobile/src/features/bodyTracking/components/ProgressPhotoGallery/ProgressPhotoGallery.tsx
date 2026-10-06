import type { BodyMetric } from '@sistem/types';
import { PROGRESS_PHOTO_POSES, formatDateOnly, photoDays, photoForPose, poseLabel } from '@sistem/shared';
import { PrivatePhoto } from '../../../../components/common/PrivatePhoto/PrivatePhoto';
import { BODY_COPY } from '../../data/bodyCopy';
import './ProgressPhotoGallery.css';

interface ProgressPhotoGalleryProps {
  metrics: BodyMetric[];
  /** A link expired while the screen was open: load the days again. */
  onLinkExpired: () => void;
  /** Edit one day's photos; read-only (the coach) without it. */
  onEditDay?: (date: string) => void;
  /** Only the newest days (Profile card); all when missing. */
  limit?: number;
}

/** Dated rows of front / side / back; tap a photo to see it full screen. */
export function ProgressPhotoGallery({ metrics, onLinkExpired, onEditDay, limit }: ProgressPhotoGalleryProps) {
  const days = photoDays(metrics).slice(0, limit);
  if (days.length === 0) return <p className="progress-photo-gallery-empty">{BODY_COPY.noPhotos}</p>;

  return (
    <ul className="progress-photo-gallery">
      {days.map((metric) => {
        const date = formatDateOnly(metric.date);
        return (
          <li key={metric.date} className="progress-photo-gallery-day">
            <div className="progress-photo-gallery-header">
              <span className="progress-photo-gallery-date">{date}</span>
              {onEditDay && (
                <button type="button" className="progress-photo-gallery-edit" onClick={() => onEditDay(metric.date)}>
                  {BODY_COPY.edit}
                </button>
              )}
            </div>
            <div className="progress-photo-gallery-row">
              {PROGRESS_PHOTO_POSES.map((pose) => {
                const photo = photoForPose(metric, pose);
                return (
                  <figure key={pose} className="progress-photo-gallery-slot">
                    {photo ? (
                      <PrivatePhoto
                        photo={photo}
                        thumbnail
                        alt={BODY_COPY.photoAlt(poseLabel(pose), date)}
                        openLabel={BODY_COPY.openPhoto(poseLabel(pose))}
                        closeLabel={BODY_COPY.close}
                        onLinkExpired={onLinkExpired}
                      />
                    ) : (
                      <div className="progress-photo-gallery-missing" aria-hidden="true" />
                    )}
                    <figcaption className="progress-photo-gallery-pose">{poseLabel(pose)}</figcaption>
                  </figure>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
