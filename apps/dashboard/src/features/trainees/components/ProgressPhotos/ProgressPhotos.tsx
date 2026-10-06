import { useState } from 'react';
import type { BodyMetric, ProgressPhotoPose } from '@sistem/types';
import {
  PROGRESS_PHOTO_POSES,
  formatDateOnly,
  formatDateShort,
  formatWeight,
  photoDatesForPose,
  photoDays,
  photoForPose,
  poseLabel,
} from '@sistem/shared';
import './ProgressPhotos.css';

interface ProgressPhotosProps {
  metrics: BodyMetric[];
}

/** A photo link (signed, 1 hour) that opens full size in a new tab. */
function PhotoLink({ metric, pose }: { metric: BodyMetric | undefined; pose: ProgressPhotoPose }) {
  const photo = photoForPose(metric, pose);
  if (!photo || !metric) return <div className="progress-photo-missing" aria-hidden="true" />;
  return (
    <a className="progress-photo-link" href={photo.url} target="_blank" rel="noreferrer">
      <img src={photo.url} alt={`${poseLabel(pose)} progress photo, ${formatDateOnly(metric.date)}`} loading="lazy" />
    </a>
  );
}

/**
 * Compare (one pose, two days side by side — first and latest by default) and every
 * day's front / side / back. Links expire after an hour: reopening the tab loads new ones.
 */
export function ProgressPhotos({ metrics }: ProgressPhotosProps) {
  const [pose, setPose] = useState<ProgressPhotoPose>('front');
  const [picked, setPicked] = useState<{ before?: string; after?: string }>({});
  const days = photoDays(metrics);
  const dates = photoDatesForPose(metrics, pose);
  const before = picked.before && dates.includes(picked.before) ? picked.before : dates[0];
  const after = picked.after && dates.includes(picked.after) ? picked.after : dates[dates.length - 1];

  if (days.length === 0) return <p className="progress-photos-empty">No progress photos yet.</p>;

  function side(label: string, date: string | undefined, key: 'before' | 'after') {
    const metric = metrics.find((item) => item.date === date);
    return (
      <div className="progress-photos-side">
        <label className="progress-photos-select">
          <span>{label}</span>
          <select value={date} onChange={(event) => setPicked((previous) => ({ ...previous, [key]: event.target.value }))}>
            {dates.map((option) => (
              <option key={option} value={option}>
                {formatDateShort(option)}
              </option>
            ))}
          </select>
        </label>
        <PhotoLink metric={metric} pose={pose} />
        {metric?.weight !== undefined && <span className="progress-photos-weight">{formatWeight(metric.weight, 'kg')}</span>}
      </div>
    );
  }

  return (
    <div className="progress-photos">
      <section className="progress-photos-compare" aria-label="Compare progress photos">
        <div className="progress-photos-poses" role="group" aria-label="Pose">
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
              {poseLabel(option)}
            </button>
          ))}
        </div>
        {dates.length < 2 ? (
          <p className="progress-photos-empty">Not enough {pose} photos to compare yet.</p>
        ) : (
          <div className="progress-photos-sides">
            {side('Before', before, 'before')}
            {side('After', after, 'after')}
          </div>
        )}
      </section>

      <ul className="progress-photos-days">
        {days.map((metric) => (
          <li key={metric.date} className="progress-photos-day">
            <span className="progress-photos-date">{formatDateOnly(metric.date)}</span>
            <div className="progress-photos-row">
              {PROGRESS_PHOTO_POSES.map((option) => (
                <figure key={option} className="progress-photos-figure">
                  <PhotoLink metric={metric} pose={option} />
                  <figcaption>{poseLabel(option)}</figcaption>
                </figure>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
