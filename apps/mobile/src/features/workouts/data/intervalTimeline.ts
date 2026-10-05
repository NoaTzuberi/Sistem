import type { SessionBlock, SetValuesByKey } from './sessionSets';

// The interval timer (HIIT / Tabata) as plain data: a list of phases and where the run
// is in it. Time always comes from stored end timestamps (device clock, ms) — never
// from counting ticks — so a throttled or backgrounded tab is right again the moment
// it looks. Pure functions only; the hook and the screen live elsewhere.

export const GET_READY_SEC = 10;

export type IntervalPhaseKind = 'ready' | 'work' | 'rest';

export interface IntervalPhase {
  kind: IntervalPhaseKind;
  durationSec: number;
  /** The exercise of a work period ('' in the free timer). */
  label: string;
  /** 1-based */
  round: number;
  rounds: number;
  /** The set a session work period logs when it ends. */
  setKey?: string;
}

export interface IntervalRun {
  phases: IntervalPhase[];
  index: number;
  /** When the current phase ends; null while paused or finished. */
  endsAt: number | null;
  /** Time left in the current phase while paused. */
  pausedMs: number | null;
  /** Indexes of the work periods that count as done. */
  doneWork: number[];
  finished: boolean;
  /**
   * Work periods that ended while she was away, waiting for "Did you do them?". Kept in
   * the run (not just on screen) so closing the app doesn't lose the question.
   */
  catchUp?: number[];
}

function readyPhase(rounds: number, label: string): IntervalPhase {
  return { kind: 'ready', durationSec: GET_READY_SEC, label, round: 1, rounds };
}

/** The free timer: work / rest for N rounds, no rest after the last work period. */
export function buildFreePhases(workSec: number, restSec: number, rounds: number): IntervalPhase[] {
  const phases: IntervalPhase[] = [readyPhase(rounds, '')];
  for (let round = 1; round <= rounds; round += 1) {
    phases.push({ kind: 'work', durationSec: workSec, label: '', round, rounds });
    if (restSec > 0 && round < rounds) phases.push({ kind: 'rest', durationSec: restSec, label: '', round, rounds });
  }
  return phases;
}

/**
 * An interval exercise or circuit of the session: round by round, each exercise's work
 * then its rest (A1 work → A1 rest → A2 work → …). Only sets not done yet are included,
 * so a restarted interval picks up where it stopped. Work = the set's seconds as she
 * left them (the coach's target unless she edited it); rest = the planned rest.
 */
export function buildBlockPhases(block: SessionBlock, values: SetValuesByKey): IntervalPhase[] {
  const rounds = Math.max(0, ...block.exercises.map((exercise) => exercise.sets.length));
  const phases: IntervalPhase[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const exercise of block.exercises) {
      const set = exercise.sets[round];
      if (!set || values[set.key]?.completed) continue;
      const workSec = values[set.key]?.durationSec ?? set.target?.durationSec ?? 0;
      if (workSec <= 0) continue;
      const label = exercise.plan.exercise?.name ?? 'Exercise';
      phases.push({ kind: 'work', durationSec: workSec, label, round: round + 1, rounds, setKey: set.key });
      const restSec = set.target?.restSec ?? 0;
      if (restSec > 0) phases.push({ kind: 'rest', durationSec: restSec, label: '', round: round + 1, rounds });
    }
  }
  // Nothing to rest for after the very last work period.
  while (phases.length > 0 && phases[phases.length - 1].kind === 'rest') phases.pop();
  if (phases.length === 0) return [];
  return [readyPhase(rounds, phases[0].label), ...phases];
}

export function startRun(phases: IntervalPhase[], now: number): IntervalRun {
  return { phases, index: 0, endsAt: now + phases[0].durationSec * 1000, pausedMs: null, doneWork: [], finished: false };
}

/** Moves the run to `now`: returns it with the indexes of the phases that ended on the way, in order. */
export function advanceRun(run: IntervalRun, now: number): { run: IntervalRun; ended: number[] } {
  if (run.finished || run.endsAt === null) return { run, ended: [] };
  let { index, endsAt } = run;
  const ended: number[] = [];
  while (endsAt <= now) {
    ended.push(index);
    index += 1;
    if (index >= run.phases.length) {
      return { run: { ...run, index: run.phases.length - 1, endsAt: null, pausedMs: null, finished: true }, ended };
    }
    endsAt += run.phases[index].durationSec * 1000;
  }
  return { run: { ...run, index, endsAt }, ended };
}

export function pauseRun(run: IntervalRun, now: number): IntervalRun {
  if (run.finished || run.endsAt === null) return run;
  return { ...run, endsAt: null, pausedMs: Math.max(0, run.endsAt - now) };
}

export function resumeRun(run: IntervalRun, now: number): IntervalRun {
  if (run.finished || run.pausedMs === null) return run;
  return { ...run, endsAt: now + run.pausedMs, pausedMs: null };
}

/** Ends the current phase now (a skipped work period is not done). Paused stays paused. */
export function skipPhase(run: IntervalRun, now: number): IntervalRun {
  if (run.finished) return run;
  const index = run.index + 1;
  if (index >= run.phases.length) return { ...run, endsAt: null, pausedMs: null, finished: true };
  const nextMs = run.phases[index].durationSec * 1000;
  return run.pausedMs !== null
    ? { ...run, index, pausedMs: nextMs }
    : { ...run, index, endsAt: now + nextMs };
}

export function markWorkDone(run: IntervalRun, indexes: number[]): IntervalRun {
  return { ...run, doneWork: [...new Set([...run.doneWork, ...indexes])] };
}

/** Rounds in which every work period was done (skipped ones don't count). */
export function countRoundsDone(run: IntervalRun): number {
  const rounds = new Map<number, boolean>();
  run.phases.forEach((phase, index) => {
    if (phase.kind !== 'work') return;
    rounds.set(phase.round, (rounds.get(phase.round) ?? true) && run.doneWork.includes(index));
  });
  return [...rounds.values()].filter(Boolean).length;
}

/** The work period after `index`, for "Next: …". */
export function nextWork(run: IntervalRun, index: number): IntervalPhase | null {
  return run.phases.slice(index + 1).find((phase) => phase.kind === 'work') ?? null;
}

export function remainingMs(run: IntervalRun, now: number): number {
  if (run.finished) return 0;
  if (run.pausedMs !== null) return run.pausedMs;
  return Math.max(0, (run.endsAt ?? now) - now);
}
