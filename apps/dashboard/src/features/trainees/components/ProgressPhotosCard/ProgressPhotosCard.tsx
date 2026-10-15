import type { CSSProperties } from 'react';
import type { BodyMetric } from '@sistem/types';
import { fill, formatDayMonth, isolateAuto, photoDays, photoForPose, poseLabel, PROGRESS_PHOTO_POSES, useCopy, useLanguage } from '@sistem/shared';
import { RangeSegmented } from '../../../stats/components/RangeSegmented/RangeSegmented';
import { usePhotoCompare } from '../../hooks/usePhotoCompare';
import { StripedEmpty } from '../StripedEmpty/StripedEmpty';
import { TabCard } from '../TabCard/TabCard';
import { traineesCopy } from '../../copy';
import './ProgressPhotosCard.css';

interface ProgressPhotosCardProps {
  metrics: BodyMetric[];
  traineeName: string;
}

/**
 * Her progress photos: one pose, before / after under a draggable split (a range input — arrow
 * keys work), and that pose's days as thumbnails; picking two sets the pair. Links are signed and
 * expire after an hour (reopening the tab loads new ones).
 */
export function ProgressPhotosCard({ metrics, traineeName }: ProgressPhotosCardProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const compare = usePhotoCompare(metrics);
  const { pose, dates, before, after, picked } = compare;
  const privateNote = fill(copy.body.privateNote, { name: isolateAuto(traineeName) });
  const startingDate = compare.startingDate;
  const startingPhoto = metrics.find((metric) => metric.date === startingDate)?.startingPhoto;
  const photoOf = (date: string) => {
    const metric = metrics.find((item) => item.date === date);
    return date === startingDate ? metric?.startingPhoto : photoForPose(metric, pose);
  };
  const altOf = (date: string) => fill(copy.photoAlt, {
    pose: date === startingDate ? copy.body.startingPhoto : poseLabel(pose, language),
    date: formatDayMonth(date, language),
  });

  if (photoDays(metrics).length === 0 && !startingDate) {
    return (
      <TabCard className="progress-photos-card" title={copy.progressPhotos} subtitle={privateNote}>
        <StripedEmpty icon="camera" text={copy.body.noPhotos} size="small" />
      </TabCard>
    );
  }

  const beforePhoto = before ? photoOf(before) : undefined;
  const afterPhoto = after ? photoOf(after) : undefined;
  const canCompare = dates.length >= 2 && beforePhoto && afterPhoto && before && after;

  return (
    <TabCard
      className="progress-photos-card"
      title={copy.progressPhotos}
      subtitle={privateNote}
      actions={
        <RangeSegmented
          label={copy.pose}
          size="compact"
          options={PROGRESS_PHOTO_POSES.map((id) => ({ id, label: poseLabel(id, language) }))}
          value={pose}
          onChange={compare.setPose}
        />
      }
    >
      {canCompare ? (
        // A computed value, not styling: where the slider splits the two photos.
        <div className="photo-compare" style={{ '--compare-split': `${compare.split}%` } as CSSProperties}>
          <img className="photo-compare-image" src={beforePhoto.url} alt={altOf(before)} />
          <img className="photo-compare-image photo-compare-after" src={afterPhoto.url} alt={altOf(after)} />
          <span className="photo-compare-chip photo-compare-chip-before">
            {before === startingDate ? copy.body.startingPhoto : copy.before} · {formatDayMonth(before, language)}
          </span>
          <span className="photo-compare-chip photo-compare-chip-after">
            {copy.after} · {formatDayMonth(after, language)}
          </span>
          <input
            className="photo-compare-range"
            type="range"
            min={0}
            max={100}
            value={compare.split}
            aria-label={copy.body.compareLabel}
            onChange={(event) => compare.setSplit(Number(event.target.value))}
          />
          <span className="photo-compare-handle" aria-hidden="true" />
        </div>
      ) : (
        <>
          {startingPhoto && startingDate && (
            <figure className="photo-starting-baseline">
              <img src={startingPhoto.url} alt={altOf(startingDate)} />
              <figcaption>{copy.body.startingPhoto} · {formatDayMonth(startingDate, language)}</figcaption>
            </figure>
          )}
          <StripedEmpty icon="camera" text={fill(copy.notEnoughPhotos, { pose: poseLabel(pose, language) })} size="small" />
        </>
      )}

      {dates.length > 0 && (
        <ul className="photo-strip" aria-label={copy.comparePhotos}>
          {dates.map((date) => {
            const photo = photoOf(date);
            if (!photo) return null;
            const isOn = picked.length > 0 ? picked.includes(date) : date === before || date === after;
            return (
              <li key={date}>
                <button type="button" className="photo-strip-thumb" aria-pressed={isOn} onClick={() => compare.pick(date)}>
                  <img src={photo.url} alt={altOf(date)} loading="lazy" />
                  <span className="photo-strip-date">{formatDayMonth(date, language)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </TabCard>
  );
}
