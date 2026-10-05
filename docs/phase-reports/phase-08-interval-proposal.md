# Phase 8 — Interval timer proposal

Status: **proposal, waiting for the owner's OK. Nothing here is built yet.**
Date: 2026-10-05. Part of Phase 8 (active workout session). All wording is placeholder.

## 1. Schema change (one field)

`PlanExercise.interval?: boolean`, in `apps/server/src/features/plans/planWorkout.schema.ts`.
Templates share the same workout schema, so they get it too.

It is added to `PlanExercise` and `PlanExerciseInput` in `@sistem/types`.

The existing fields drive the timer:

| Timer value | Comes from |
|---|---|
| Work | each set's `durationSec` |
| Rest | each set's `restSec` (0 allowed) |
| Rounds | the number of sets |

**Server rules** (`plan.validation.ts`, returned as `issues` like the other plan rules):
- An interval exercise must be timed: every resolved set has `durationSec` and no reps.
- Inside a superset group, either every exercise is Interval or none is.

**Circuits** (a superset of interval exercises):
- Rounds = the group's largest set count.
- An exercise with fewer sets is skipped in the later rounds.
- Order inside a round: A1 work → A1 rest → A2 work → A2 rest → … → next round.

**Dashboard (plan builder):** an "Interval" checkbox on a timed exercise row. Ticking it on one exercise of a superset ticks the whole group.

## 2. Interval mode inside a session

The exercise or circuit block shows "Interval · 8 rounds · 20s work / 10s rest" and a big **▶ Start interval** button. The set rows stay underneath and can still be edited by hand.

### Interval screen (full screen, screen kept awake)

```
┌──────────────────────────────────────┐
│ ✕                              🔊    │  ✕ = stop (confirm) · mute toggle
│                                      │
│               WORK                   │  WORK = pink background · REST = surface
│                                      │
│               0:17                   │  huge digits, from a stored end time
│                                      │
│           Jumping jacks              │
│           Round 2 of 8               │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░                   │  this phase's progress
│  Next: Rest 10s → Burpees            │
│                                      │
│   [ ❚❚ Pause ]        [ ⏭ Skip ]     │  Skip = end this phase now
└──────────────────────────────────────┘
```

**Behavior**
- **Get ready:** a 10 s "GET READY" phase runs before the first round, so she isn't working the moment she taps Start. It beeps like the other phases. Open question: keep the lead-in, or drop it?
- **Hands-free:** after one tap on Start, it runs work → rest → next exercise or round automatically until every round is done.
- **Logging:** each finished work period marks its set done, with the work seconds logged.
- **Skip:** ends the current phase. A skipped work period stays not done.
- **Pause / resume:** pausing stores the time left in the phase, and resuming sets a new end time from it.
- **The end:** "Interval done · 8 / 8 rounds" → **Back to workout**. The normal rest timer doesn't start.
- **Stopping early (✕, with a confirm):** sets already logged stay done.

**Timing**
- Every phase runs from a stored end timestamp, never by counting ticks. A throttled or backgrounded tab is correct again the moment it's visible.
- If the app is backgrounded or closed mid-run, on return the timer catches up from the stored timestamps. Phases that ended in the meantime count as finished, and their work periods are logged as done.

## 3. Free interval timer

`/timer`, full screen, with no tab bar. It opens from **Home** ("Interval timer") and from the session's **⋯ menu**.

```
┌──────────────────────────────────────┐
│ ←  Interval timer                    │
│ WORK      [−]  0:20  [+]             │  ±5 s
│ REST      [−]  0:10  [+]             │  ±5 s, 0 allowed
│ ROUNDS    [−]   8    [+]             │  ±1
│ Total 4:00                           │
│ [              START               ] │
└──────────────────────────────────────┘
```

- It runs on the same interval screen, with "Round 2 of 8" in place of an exercise name. The same Get ready, Pause, Skip, sounds and wake lock apply.
- It **logs nothing**. It needs no connection and works offline.
- Her last values and the mute setting are remembered on the phone (localStorage, best effort).

## 4. Sounds and vibration

Sounds play in work, rest and Get ready alike:

| When | Sound |
|---|---|
| 10 s left | one beep |
| 3, 2, 1 s left | one beep each |
| 0 (the phase switches) | a distinct longer, lower beep |

- **Web Audio API**, unlocked by the Start tap (browsers block audio that isn't started by a tap).
- A **mute toggle** on the interval screen.
- **Vibration** where the browser supports it (Android). iOS Safari has no Vibration API.

**Known browser limits**, which will also go in the phase report:
- On iPhone in the browser, Web Audio is muted by the silent switch.
- Nothing plays while the screen is locked, or while the app is in the background.
- The phone doesn't vibrate on iPhone.
- Native audio and notifications come with Capacitor in Phase 5b.

## 5. Where it would live (planned files)

**Server and contract**
- `apps/server/src/features/plans/planWorkout.schema.ts`, `plan.validation.ts`, `plan.service.ts`
- Plan builder input handling and tests.
- `packages/types` (the `interval` field).

**Dashboard**
- The Interval checkbox in the plan editor's exercise row.

**Mobile**
- Interval timeline + catch-up logic: `features/workouts/data/intervalTimeline.ts`
- Beeps: `features/workouts/data/intervalSounds.ts` (Web Audio)
- The interval screen: an `IntervalTimer` component
- The free timer: `IntervalTimerPage` (`/timer`)
- Entry points on Home and in the session ⋯ menu.
- Placeholder wording in `workoutCopy.ts`.

**Dependencies:** none new.

## 6. Decisions needed from the owner

1. OK the `interval` flag as described, with the superset rule "all or none"?
2. Keep the 10 s "Get ready" lead-in, or drop it?
3. Catch-up after the app was closed mid-run: count the work periods that ended in the meantime as done (proposed), or leave them not done?
