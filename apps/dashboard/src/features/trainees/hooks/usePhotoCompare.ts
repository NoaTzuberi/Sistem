import { useState } from 'react';
import type { BodyMetric, ProgressPhotoPose } from '@sistem/types';
import { photoDatesForPose } from '@sistem/shared';

const MIDDLE = 50;

/**
 * The before / after compare of the progress photos: one pose, two of its days (first and latest
 * until the coach picks two thumbnails — the older one is always "before"), and the slider's split.
 */
export function usePhotoCompare(metrics: BodyMetric[]) {
  const [pose, setPoseState] = useState<ProgressPhotoPose>('front');
  // Thumbnails clicked since the last pair: a third click starts a new pair.
  const [picked, setPicked] = useState<string[]>([]);
  const [split, setSplit] = useState(MIDDLE);
  const dates = photoDatesForPose(metrics, pose);
  const valid = picked.filter((date) => dates.includes(date));
  const pair = valid.length === 2 ? [...valid].sort() : [dates[0], dates.at(-1)];

  function setPose(next: ProgressPhotoPose) {
    setPoseState(next);
    setPicked([]);
    setSplit(MIDDLE);
  }

  function pick(date: string) {
    setPicked((current) => {
      const kept = current.filter((entry) => dates.includes(entry));
      if (kept.includes(date)) return kept.filter((entry) => entry !== date);
      return kept.length >= 2 ? [date] : [...kept, date];
    });
  }

  return {
    pose,
    setPose,
    dates,
    before: pair[0],
    after: pair[1],
    /** The thumbnails chosen so far (one = waiting for its partner). */
    picked: valid,
    pick,
    split,
    setSplit,
  };
}
