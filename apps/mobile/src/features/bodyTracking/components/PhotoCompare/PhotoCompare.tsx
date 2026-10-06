import { useState } from 'react';
import type { BodyMetric, ProgressPhotoPose, WeightUnit } from '@sistem/types';
import { PROGRESS_PHOTO_POSES, formatDateOnly, formatDateShort, formatWeight, photoDatesForPose, photoForPose, poseLabel } from '@sistem/shared';
import { PrivatePhoto } from '../../../../components/common/PrivatePhoto/PrivatePhoto';
import { Select } from '../../../../components/common/Select/Select';
import { BODY_COPY } from '../../data/bodyCopy';
import './PhotoCompare.css';

interface PhotoCompareProps {
  metrics: BodyMetric[];
  weightUnit: WeightUnit;
  onLinkExpired: () => void;
}

interface Choice {
  before: string;
  after: string;
}

/** First and latest day of a pose: the default before / after. */
function defaultChoice(dates: string[]): Choice {
  return { before: dates[0] ?? '', after: dates[dates.length - 1] ?? '' };
}

/**
 * Side by side: one pose on two days (owner decision — a slider overlay is backlog).
 * Opens on the first and the latest day; each side can pick any day that has a photo of
 * that pose. The weight of that day is shown under it when she logged one.
 */
export function PhotoCompare({ metrics, weightUnit, onLinkExpired }: PhotoCompareProps) {
  const [pose, setPose] = useState<ProgressPhotoPose>('front');
  const dates = photoDatesForPose(metrics, pose);
  const [choice, setChoice] = useState<Choice>(() => defaultChoice(dates));
  // A pick that no longer has a photo (another pose, a removed photo) falls back to the default.
  const before = dates.includes(choice.before) ? choice.before : defaultChoice(dates).before;
  const after = dates.includes(choice.after) ? choice.after : defaultChoice(dates).after;
  const options = dates.map((date) => ({ value: date, label: formatDateShort(date) }));

  function changePose(next: ProgressPhotoPose) {
    setPose(next);
    setChoice(defaultChoice(photoDatesForPose(metrics, next)));
  }

  function side(label: string, date: string, onChange: (date: string) => void) {
    const metric = metrics.find((item) => item.date === date);
    const photo = photoForPose(metric, pose);
    return (
      <div className="photo-compare-side">
        {photo && (
          <PrivatePhoto
            photo={photo}
            thumbnail
            alt={BODY_COPY.photoAlt(poseLabel(pose), formatDateOnly(date))}
            openLabel={BODY_COPY.openPhoto(poseLabel(pose))}
            closeLabel={BODY_COPY.close}
            onLinkExpired={onLinkExpired}
          />
        )}
        <Select label={label} options={options} value={date} onChange={(event) => onChange(event.target.value)} />
        {metric?.weight !== undefined && <span className="photo-compare-weight">{formatWeight(metric.weight, weightUnit)}</span>}
      </div>
    );
  }

  return (
    <div className="photo-compare">
      <div className="photo-compare-poses" role="group" aria-label={BODY_COPY.comparePose}>
        {PROGRESS_PHOTO_POSES.map((option) => (
          <button
            key={option}
            type="button"
            className={'photo-compare-pose' + (option === pose ? ' photo-compare-pose-active' : '')}
            aria-pressed={option === pose}
            onClick={() => changePose(option)}
          >
            {poseLabel(option)}
          </button>
        ))}
      </div>

      {dates.length < 2 ? (
        <p className="photo-compare-empty">{BODY_COPY.compareEmpty}</p>
      ) : (
        <div className="photo-compare-sides">
          {side(BODY_COPY.before, before, (date) => setChoice({ before: date, after }))}
          {side(BODY_COPY.after, after, (date) => setChoice({ before, after: date }))}
        </div>
      )}
    </div>
  );
}
