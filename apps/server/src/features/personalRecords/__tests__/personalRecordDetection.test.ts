import { describe, it, expect } from 'vitest';
import { detectPersonalRecords } from '../personalRecordDetection';
import type { PrSet } from '../personalRecordDetection';

// Phase 9: PR rules — working sets only, the first time is a baseline, one PR per
// exercise (weight → reps → duration), interval holds never count.

const SQUAT = 'squat';
const PLANK = 'plank';

function set(fields: Partial<PrSet>): PrSet {
  return { exerciseId: SQUAT, completed: true, ...fields };
}

describe('detectPersonalRecords', () => {
  it('the first time on an exercise is a baseline, not a PR', () => {
    expect(detectPersonalRecords([set({ reps: 5, weight: 100 })], [])).toEqual([]);
  });

  it('a heavier weight than ever is a weight PR', () => {
    const history = [set({ reps: 8, weight: 60 }), set({ reps: 5, weight: 70 })];
    expect(detectPersonalRecords([set({ reps: 3, weight: 72.5 })], history)).toEqual([
      { exerciseId: SQUAT, type: 'weight', newValue: 72.5, previousValue: 70 },
    ]);
  });

  it('equal to the best is not a PR', () => {
    expect(detectPersonalRecords([set({ reps: 5, weight: 70 })], [set({ reps: 5, weight: 70 })])).toEqual([]);
  });

  it('more reps at a weight done before is a reps PR — the heaviest such weight wins', () => {
    const history = [set({ reps: 8, weight: 60 }), set({ reps: 5, weight: 80 }), set({ reps: 10, weight: 40 })];
    const current = [set({ reps: 12, weight: 40 }), set({ reps: 10, weight: 60 })];
    expect(detectPersonalRecords(current, history)).toEqual([
      { exerciseId: SQUAT, type: 'reps', newValue: 10, previousValue: 8, weight: 60 },
    ]);
  });

  it('a weight never done before is a baseline for reps', () => {
    expect(detectPersonalRecords([set({ reps: 15, weight: 50 })], [set({ reps: 8, weight: 60 })])).toEqual([]);
  });

  it('bodyweight reps: no weight and 0 kg are the same', () => {
    expect(detectPersonalRecords([set({ reps: 20 })], [set({ reps: 15, weight: 0 })])).toEqual([
      { exerciseId: SQUAT, type: 'reps', newValue: 20, previousValue: 15 },
    ]);
  });

  it('a weight PR wins over a reps PR on the same exercise', () => {
    const history = [set({ reps: 5, weight: 60 })];
    const current = [set({ reps: 8, weight: 60 }), set({ reps: 2, weight: 65 })];
    expect(detectPersonalRecords(current, history)).toEqual([
      { exerciseId: SQUAT, type: 'weight', newValue: 65, previousValue: 60 },
    ]);
  });

  it('warm-ups and drop sets never count, on either side', () => {
    const history = [set({ reps: 5, weight: 60 }), set({ reps: 5, weight: 90, type: 'warmup' })];
    // A drop set's many reps at a light weight, a heavy "warm-up": no PR.
    const current = [
      set({ reps: 20, weight: 60, type: 'drop' }),
      set({ reps: 1, weight: 80, type: 'warmup' }),
      set({ reps: 5, weight: 60, type: 'working' }),
    ];
    expect(detectPersonalRecords(current, history)).toEqual([]);
    // The working set at 65 beats the working 60 — the warm-up at 90 was never a record.
    expect(detectPersonalRecords([set({ reps: 3, weight: 65 })], history)).toEqual([
      { exerciseId: SQUAT, type: 'weight', newValue: 65, previousValue: 60 },
    ]);
  });

  it('sets not done never count', () => {
    expect(detectPersonalRecords([set({ reps: 5, weight: 100, completed: false })], [set({ reps: 5, weight: 60 })])).toEqual([]);
  });

  it('a longer hold at the same weight is a duration PR', () => {
    const history = [set({ exerciseId: PLANK, durationSec: 60 }), set({ exerciseId: PLANK, durationSec: 30, weight: 10 })];
    expect(detectPersonalRecords([set({ exerciseId: PLANK, durationSec: 75 })], history)).toEqual([
      { exerciseId: PLANK, type: 'duration', newValue: 75, previousValue: 60 },
    ]);
    expect(detectPersonalRecords([set({ exerciseId: PLANK, durationSec: 40, weight: 10 })], history)).toEqual([
      { exerciseId: PLANK, type: 'duration', newValue: 40, previousValue: 30, weight: 10 },
    ]);
  });

  it('a weighted hold is not a weight PR', () => {
    const history = [set({ exerciseId: PLANK, durationSec: 60, weight: 5 })];
    expect(detectPersonalRecords([set({ exerciseId: PLANK, durationSec: 30, weight: 20 })], history)).toEqual([]);
  });

  it('interval holds run on the coach clock and never count', () => {
    const history = [set({ exerciseId: PLANK, durationSec: 20 })];
    const current = [set({ exerciseId: PLANK, planExerciseId: 'p1', durationSec: 40 })];
    expect(detectPersonalRecords(current, history, new Set(['p1']))).toEqual([]);
    expect(detectPersonalRecords(current, history, new Set(['other']))).toHaveLength(1);
  });

  it('one PR per exercise, in workout order', () => {
    const history = [set({ reps: 5, weight: 60 }), set({ exerciseId: PLANK, durationSec: 30 })];
    const current = [set({ exerciseId: PLANK, durationSec: 45 }), set({ reps: 5, weight: 62.5 }), set({ reps: 5, weight: 65 })];
    expect(detectPersonalRecords(current, history).map((record) => [record.exerciseId, record.type, record.newValue])).toEqual([
      [PLANK, 'duration', 45],
      [SQUAT, 'weight', 65],
    ]);
  });
});
