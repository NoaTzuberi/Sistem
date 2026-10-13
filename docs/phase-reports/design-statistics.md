# Design update — Statistics page: color, motion and live hover (apps/dashboard)

Date: 2026-10-13. Reference: `docs/design/coach-dashboard.html` → "סטטיסטיקה" (visual reference
only; nothing was copied from its code).

## Summary

The Statistics page keeps its metrics, its copy and its grid, and gets the new look: four tiles
in their own colors with a change pill and a sparkline or meter, a smooth area chart, gradient
bars with an average line, colored goal rows, and retention rings with a star rating. Every
chart has a live hover with a glass tooltip. An entrance (lines drawing, bars growing, numbers
counting up) plays once per browser session and never on a range change or a resize. Sparse
data no longer looks broken: months before the first trainee are "no data", not 0. The stats
endpoint returns three small extra values the new elements need. No dependency was added.

## What each part does now

1. **Range control** — `RangeSegmented`: a white thumb slides between 3 חודשים / 6 חודשים / שנה
   (transform only, 260 ms). Its classes are `range-segmented*`; the notifications panel's are
   `filter-segment*` — no shared name. The old common `SegmentedControl` had no other user and
   was deleted.
2. **Tiles** — `StatTile` with `data-tone` pink / purple / orange / blue (tokens), a blurred
   cloud in the top inline-end corner, a white change pill (▲ / ▼), and under the number:
   `Sparkline` (active, new — the last 6 months) or `Meter` (completion; time-to-plan with a mark
   at 48 h). Hover lifts the tile and swells the cloud; keyboard focus gives the same cloud.
3. **Active trainees** — `ActiveTraineesChart`: smooth curve, light → pink stroke, fading fill,
   halo on the newest point; header: the current number and "+X בתקופה". Hover: dashed pink
   crosshair, hollow dot, tooltip with the month, the value and "+N מהחודש הקודם".
4. **Weekly workouts** — `WeeklyWorkoutsChart`: gradient bars, the current week solid, dashed
   Cherry "ממוצע N" line; header: this week's number and "השבוע". Hover: that bar solid, the
   others at 40 %, tooltip "שבוע N". A week with 0 is a 3 px stub.
5. **Goals** — `GoalsList`: dot + bar per goal in pink / purple / orange / blue (cycling), bar
   length relative to the top goal, the count and a small % under it; the hovered row stands out.
6. **Retention** — `RetentionCard`: three `RingGauge` tiles (pink → #D4005C → Cherry Rose) and a
   rating tile with `RatingStars` (4.6 = four stars and 60 % of the fifth). No eligible trainees
   yet: "—" and "אין עדיין נתונים", not 0 %.
7. **Layout** — the same grid; at ≤ 1100 px the tiles go 2 × 2 and the cards stack; at ≤ 640 px
   the three rings share a row and the rating takes the row under them.

## Sparse and empty data

- A month earlier than the coach's first trainee sign-up has **no data**: the line starts at the
  first month that has it, the axis still names every month.
- One month of data: the point, its halo and its number — no line to zero.
- No data at all (area chart), or all eight weeks at 0 (bars): "עוד אין מספיק נתונים לגרף הזה".
- The month-change pills (active, new) are hidden when last month is before the first trainee:
  there is no previous value to compare with.

With the current dev data this means: the area chart shows one point (October = 2). September
used to show 3 — see "Known issues" 1.

## Motion (emil-design-eng)

- Press: `scale(0.97)` on the range buttons, transform only. Hover only inside
  `@media (hover: hover) and (pointer: fine)`. Curve `cubic-bezier(.23, 1, .32, 1)`
  (the existing `--ease-press`). No `transition: all` anywhere.
- Entrance once per session (`useStatsIntro`, a `sessionStorage` flag): line 1100 ms via
  `stroke-dashoffset` with `pathLength=1`, fill fades in after 250 ms, bars `scaleY` staggered
  45 ms, goal bars `scaleX` staggered 60 ms, rings 1000 ms, meters `scaleX`, numbers count up over
  800 ms (`useCountUp`, ease-out cubic). The `is-intro` class is removed when it is over.
- The tooltip moves with `transform` (120 ms), not `left` / `top`: same look, no layout work.
- Reduced motion: no entrance class at all, final values at once, no lift.

## Server (read-only, no schema change)

`GET /api/coach/stats` gained, in `coachStats.ts` + `@sistem/types`:

- `firstTraineeMonth` — 'YYYY-MM' of the first trainee sign-up (coach's zone), or null.
- `recentMonths` — the last six months (`active`, `newTrainees`), whatever the range: the
  sparklines.
- `summary.hoursToFirstPlanPrevious` — the same average for the period of the same length just
  before the range: the time-to-plan pill.

## Decisions I made — please check

1. **Three values were added to the endpoint** instead of dropping the sparklines and the
   time-to-plan pill: the data existed, it was only not sent.
2. **The time-to-plan pill compares with the previous period of the same length** (6 months vs
   the 6 before). The reference shows "▼ 4 שע׳" without saying what it compares with.
3. **"Bad" direction** (muted pill): fewer active / fewer new trainees; a longer wait for a plan.
4. **Goal %** = the goal's share of all the goals chosen (they add up to 100 %), as in the
   reference — not the share of trainees, although the card's subtitle counts trainees.
5. **The weekly average covers all 8 weeks**, the current (unfinished) one included.
6. **Under the bars: week numbers** (as in the reference and the tooltip) instead of dates; the
   dates stay in the screen-reader list.
7. **Time-to-plan meter**: the track is 48 h; when the wait is longer the track becomes the wait
   and the mark moves back to where 48 h is.
8. **Breakpoint 1100 px** for this page (the brief); the Overview keeps 1180 px.
9. **Stars fill from the left in both languages**, like the digits of the number.
10. **"Once per session"** = per browser tab session; a new tab plays the entrance again.

## Dropped / not in the data

Nothing was dropped. No green was found: `tokens.css` has no `--ok` / success-green token.

## New tokens (`packages/tokens/tokens.css`)

`--color-stat-{pink,purple,orange,blue}` + `-cloud` + `-mist`; `--color-chart-line-start`,
`--color-chart-bar-end`, `--color-ring-mid`, `--color-rating-cloud`, `--color-rating-cloud-warm`,
`--color-meter-track`, `--color-star-rest`; `--surface-chart-tip`, `--surface-delta-pill`;
`--radius-chart-tip`; `--shadow-tile-lift`, `--shadow-cell-lift`, `--shadow-chart-tip`;
`--blur-chart-tip`, `--blur-stat-cloud`, `--blur-rating-cloud`; `--transition-range-thumb`,
`--transition-lift`, `--transition-cloud`, `--transition-chart-tip`; `--intro-*` (line, area,
area-delay, bar, bar-step, goal, goal-step, ring, meter); `--breakpoint-stats-fold`,
`--breakpoint-stats-phone`. Goal rows reuse `--color-workout-1…4`.

## i18n keys — `features/stats/copy` (he from the reference; English is placeholder)

`chartEmpty`, `noChange`, `tiles.windowMark`, `active.inRange`, `active.sinceLastMonth`,
`weekly.thisWeek`, `weekly.average`, `weekly.week`, `weekly.sinceLastWeek`, `retention.noData`.

## Files

Added — `apps/dashboard/src/features/stats/`:
- `components/` RangeSegmented, Sparkline, Meter, ChartTooltip, ChartHeadline,
  ActiveTraineesChart, WeeklyWorkoutsChart, GoalsList, RetentionCard, RingGauge, RatingStars
  (each `.tsx` + `.css`)
- `hooks/` useStats.ts, useStatsIntro.ts, useCountUp.ts, useChartHover.ts
- `data/statsFormat.ts`
- `docs/phase-reports/design-statistics.md`

Modified:
- `features/stats/`: `pages/StatsPage` (tsx, css), `components/StatTile` (tsx, css),
  `components/ChartFrame` (tsx, css), `data/chartScales.ts`, `copy/he.ts`, `copy/en.ts`
- `packages/tokens/tokens.css`, `packages/types/src/index.ts`
- `apps/server/src/features/coach/coachStats.ts`, `__tests__/coachStats.test.ts`

Deleted:
- `features/stats/components/` AreaChart, WeeklyBars, GoalBars, RetentionRow;
  `hooks/useCoachStats.ts` (now `useStats.ts`)
- `apps/dashboard/src/components/common/SegmentedControl/`

## Dependencies

None added or removed.

## How to test

```bash
npm run build     # passes
npm run lint      # passes (the i18n audit is clean)
npm test          # passes: server 42 files / 600 tests (2 new), copy + client 3 files / 30 tests
npm run dev:all   # then http://localhost:5174/stats
```

Checked in headless Chrome against the local server, logged in as the dev coach:

- **Real dev data** (2 active, one week with workouts, every trainee signed up this month) at
  1440 px and 390 px.
- **A full year** and **an empty account** (the endpoint's answer replaced in the browser) —
  Hebrew and English, 1440 / 1024 / 390 px, each range.
- **No horizontal scroll** in any of them (page width = viewport width).
- **Hover** on the area chart, a bar, a goal row and a tile; the tooltip at the chart's edge at
  390 px stays inside the card.
- **Entrance**: all six animations run on the first visit; afterwards a range change, a resize
  and a second visit in the same session start none.
- **Reduced motion**: no entrance class, the final number at once.
- **Keyboard**: a focused tile matches `:focus-visible` and its cloud is at scale 1.35, opacity 1.
- No console errors.

By hand (to see the entrance again, open the page in a new tab):
1. Change the range: only the area chart and the range-dependent numbers change, nothing replays.
2. Tab through the page: the range buttons, then the four tiles.
3. Switch to EN: time runs left → right, the thumb and the meters mirror.

Not checked: Safari and Firefox; a real touch device.

## Known issues / TODOs

1. **"Active at the end of a month" can count a month before the trainee existed**: the server
   looks for a published plan for that week or the next one, so a plan made in early October for
   the week of 27 September counts for September. The chart hides such months (they are before
   the first sign-up), but `summary.activeTraineesChange` still uses the same rule. Say if you
   want the rule itself changed.
2. The dashed average label can sit on top of a tall bar at the newest end; it has a white edge
   so it stays readable.
3. Long English goal names are cut with "…" at 130 px (English is placeholder).
4. `packages/tokens/tokens.css` also holds the uncommitted plan-builder tokens — see the note
   under the commands.

## Suggested commits

1. `feat(server): sparkline months, first trainee month and previous wait in coach stats`
2. `feat(tokens): statistics identity colors, chart tooltip and entrance tokens`
3. `feat(dashboard): statistics page — color, motion and live hover`
4. `docs: statistics design update report`

```bash
git add -A -- packages/types/src/index.ts apps/server/src/features/coach/coachStats.ts apps/server/src/features/coach/__tests__/coachStats.test.ts
git commit -m "feat(server): sparkline months, first trainee month and previous wait in coach stats"

git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): statistics identity colors, chart tooltip and entrance tokens"

git add -A -- apps/dashboard/src/features/stats apps/dashboard/src/components/common/SegmentedControl
git commit -m "feat(dashboard): statistics page — color, motion and live hover"

git add -A -- docs/phase-reports/design-statistics.md
git commit -m "docs: statistics design update report"
```

`tokens.css` is one file with the plan-builder tokens (and any later ones) still uncommitted in
it: commit 2 takes them all. If the plan-builder token commit comes first, this one then holds
only the statistics tokens. `packages/types/src/index.ts` holds only this task's 15 lines.
