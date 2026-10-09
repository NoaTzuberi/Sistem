import { useState } from 'react';
import type { BodyMetric, ProgressPhotoPose } from '@sistem/types';
import { fill, formatDateOnly, formatDateShort, formatWeight, photoDatesForPose, photoDays, photoForPose, poseLabel, PROGRESS_PHOTO_POSES, useCopy, useLanguage } from '@sistem/shared';
import './ProgressPhotos.css';
import { traineesCopy } from '../../copy';

interface ProgressPhotosProps {
  metrics: BodyMetric[];
}

/** A photo link (signed, 1 hour) that opens full size in a new tab. */
function PhotoLink({ metric, pose }: { metric: BodyMetric | undefined; pose: ProgressPhotoPose }) {
  const copy = useCopy(traineesCopy);
  const language = useLanguage();
  const photo = photoForPose(metric, pose);
  if (!photo || !metric) return <div className="progress-photo-missing" aria-hidden="true" />;
  return (
    <a className="progress-photo-link" href={photo.url} target="_blank" rel="noreferrer">
      <img src={photo.url} alt={fill(copy.photoAlt, { pose: poseLabel(pose, language), date: formatDateOnly(metric.date, language) })} loading="lazy" />
    </a>
  );
}

/**
 * Compare (one pose, two days side by side — first and latest by default) and every
 * day's front / side / back. Links expire after an hour: reopening the tab loads new ones.
 */
export function ProgressPhotos({ metrics }: ProgressPhotosProps) {
  const language = useLanguage();
  const copy = useCopy(traineesCopy);
  const [pose, setPose] = useState<ProgressPhotoPose>('front');
  const [picked, setPicked] = useState<{ before?: string; after?: string }>({});
  const days = photoDays(metrics);
  const dates = photoDatesForPose(metrics, pose);
  const before = picked.before && dates.includes(picked.before) ? picked.before : dates[0];
  const after = picked.after && dates.includes(picked.after) ? picked.after : dates[dates.length - 1];

  if (days.length === 0) return <p className="progress-photos-empty">{copy.noPhotos}</p>;

  function side(label: string, date: string | undefined, key: 'before' | 'after') {
    const metric = metrics.find((item) => item.date === date);
    return (
      <div className="progress-photos-side">
        <label className="progress-photos-select">
          <span>{label}</span>
          <select value={date} onChange={(event) => setPicked((previous) => ({ ...previous, [key]: event.target.value }))}>
            {dates.map((option) => (
              <option key={option} value={option}>
                {formatDateShort(option, language)}
              </option>
            ))}
          </select>
        </label>
        <PhotoLink metric={metric} pose={pose} />
        {metric?.weight !== undefined && <span className="progress-photos-weight">{formatWeight(metric.weight, 'kg', language)}</span>}
      </div>
    );
  }

  return (
    <div className="progress-photos">
      <section className="progress-photos-compare" aria-label={copy.comparePhotos}>
        <div className="progress-photos-poses" role="group" aria-label={copy.pose}>
          {PROGRESS_PHOTO_POSES.map((option) => (
            <button
              key={option}
              type="button"
              className="progress-photos-pose"
              aria-pressed={option === pose}
              onClick={() => {
                setPose(option);
                setPicked({});
              }}
            >
              {poseLabel(option, language)}
            </button>
          ))}
        </div>
        {dates.length < 2 ? (
          <p className="progress-photos-empty">{fill(copy.notEnoughPhotos, { pose: poseLabel(pose, language) })}</p>
        ) : (
          <div className="progress-photos-sides">
            {side(copy.before, before, 'before')}
            {side(copy.after, after, 'after')}
          </div>
        )}
      </section>

      <ul className="progress-photos-days">
        {days.map((metric) => (
          <li key={metric.date} className="progress-photos-day">
            <span className="progress-photos-date">{formatDateOnly(metric.date, language)}</span>
            <div className="progress-photos-row">
              {PROGRESS_PHOTO_POSES.map((option) => (
                <figure key={option} className="progress-photos-figure">
                  <PhotoLink metric={metric} pose={option} />
                  <figcaption>{poseLabel(option, language)}</figcaption>
                </figure>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
