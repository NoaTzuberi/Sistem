# Design update — trainee profile: Body, Achievements, Nutrition tabs

Reference: `docs/design/coach-dashboard.html` (visual only).

## Summary

- **Body** is now a data page:
  - four Statistics-style tiles;
  - a pink area chart for weight that fills its card, with a range control, a glass tooltip and a one-time draw-in;
  - a measurements card: a chart for the chosen measurement, plus color rows with sparklines that work as a radiogroup;
  - a records table showing the latest 5 rows, with "Show all";
  - progress photos: a before/after compare slider (a range input) and a thumbnail strip where picking two sets the pair.
- **Achievements** is game-like:
  - a pink hero with a count-up number, an XP bar and "next up", plus a glass streak card and a latest-unlock card;
  - a stats row;
  - a filter (all / unlocked / on the way);
  - badges grouped by category, with glossy and locked medals, progress rings, a 3D tilt, a light sweep and a spotlight;
  - a modal with a medal flip, a one-time confetti burst and focus return.
- **Nutrition** is a summary that leads to the builder:
  - a current-plan card with a kcal donut, group bars and meal cards;
  - preference tiles, with unanswered fields folded into one "לא צוין: …" line;
  - an empty state built from her real preferences (the AI-draft button only when a ready nutrition draft exists).
- Shared Statistics pieces are reused rather than copied: StatTile, RangeSegmented (new `compact` size), ChartTooltip, useChartHover, useCountUp, chartScales (smoothPath, isTimeAxisReversed) and useStatsIntro (now takes a storage key, one per tab).
- No server, API or schema changes. No new dependencies.

## Hidden (no data source)

- **Body:** none of the design's photo placeholders; real signed photos only.
- **Nutrition:**
  - Macro grams: the plan is exchange-list portions, so the donut and bars show each portion group's share of the day's kcal (portions × the group's kcal) and portions a day.
  - Meal times and the plan name: the title shows the plan's goal label instead.
  - Past plans list (`PastNutritionPlans`): there is no versions-history endpoint, so the component was not built.
- **Achievements:** nothing hidden. The stats row uses `completedWorkouts`, this week, `totalVolume` and `personalRecords`.

## Category mapping (Achievements)

| Design category | App achievements |
|---|---|
| אימונים #FF006E | first_workout, workouts_5…100, first_pump_photo (the Daily Pump is the last step of a workout) |
| רצפים #FF7A00 | streak_2…52, comeback |
| שבוע מושלם #7C4DFF | perfect_week |
| שיאים אישיים #0094FF | first_weight_pr, first_reps_pr, prs_10/25/50 |
| נפח #A50047 | volume_10k…1m |
| **extra: גוף #D9952B (amber)** | first_measurement, first_progress_photo, weigh_ins_10. The design has no body-tracking category. |

**OWNER:**
- Please confirm or rename the extra category. Its label reuses the Body tab's name and is marked PLACEHOLDER.
- Please confirm its amber color.

## Decisions / notes

- **Time direction:** the body charts now run right → left in Hebrew, as the brief asks. They use the same `TIME_AXIS_FOLLOWS_DIRECTION` switch as the Statistics charts. This differs from the Phase 15 PRD line "Charts keep time left → right"; one switch flips it back.
- **Repeatable badges** (perfect_week, comeback) have no target, so a locked one shows "עדיין לא".
- **"Next up"** is the locked badge with the highest progress ratio; ties go to config order. With no workouts it is the first badge and the hero reads "יפתח עם האימון הראשון".
- **Logs tab:** in your follow-up edit, the Logs tab now also sits on the canvas.
- **Copy:**
  - New strings were added in he and en, from the brief.
  - PLACEHOLDER (not in the design): "הצגת פחות", the achievement filter's screen-reader label, the empty-filter lines, and the extra category's label.
  - Unused keys were removed: bodyEmpty, overRange, nothingLogged, bestStreak, achievementsCaption, achievement, rule, and nutrition tabTitle/tabEmpty/openBuilder.
- **Deleted:** `BodyTrendChart` and `ProgressPhotos`, both superseded.
- **Shared code added:** `nutritionPreferenceFields()` in `@sistem/shared` (`nutritionDisplay.ts`).
- **Tokens added:**
  - glass card;
  - measurement colors;
  - achievement category colors, hero, medal and modal values;
  - macro colors and nutrition clouds;
  - motion: `--transition-medal-sweep`, `--transition-medal-flip`, `--transition-confetti`, `--confetti-spread`, `--confetti-delay`, `--intro-xp`, `--blur-ach-glow`.
- **Global color classes** in `styles/globals.css`: `.measure-color-*`, `.ach-category-*`, `.nutrition-group-*`.

## How to test

- `npm run build -w @sistem/dashboard`, `npm run lint` and `npm run test:i18n`: all pass (30 tests).
- Browser checks done with the seed coach:
  - Dev Trainee Two:
    - Body: tiles, both charts in RTL, the tooltip and switching measurements.
    - Achievements: hero, stats and badge groups.
  - Not finished: the modal, Nutrition, 390px width and EN. The browser was taken over mid-check; please run these.
- Manual checklist:
  - each tab with full data and fully empty (test10 has one weight record and preferences);
  - no photos / no measurements;
  - a badge at 0 progress (no ring stroke);
  - the modal: Esc, the scrim and ✕ close it, and focus returns;
  - keyboard: measurement rows (arrow keys), badges, the compare slider (arrows) and the chart (← →);
  - reduced motion: no draw-in, count-up, tilt, flip or confetti;
  - 390px: tiles and stats 2 × 2, badges 2 per row, the hero stacks, the donut sits above the bars, meals in 1 column, no sparklines, no horizontal page scroll.

## Known issues / TODOs

- The extra achievement category needs your decision (see above).
- The past nutrition plans list needs a versions-history endpoint (backlog).
- In `@sistem/shared`, `formatUnlockedDate` shows the full date ("6 באוק׳ 2026"); the design shows day and month only.

## Suggested commits

The code of this round is already in your commit `f9a7090` ("redesign coach dashboard…"). Only this report is left to commit. The other uncommitted changes in the tree (starting photo, Logs tab) are your parallel work, not this round's.

```
git add -A -- docs/phase-reports/design-trainee-body-achievements-nutrition.md
git commit -m "docs: trainee body, achievements and nutrition tabs design report"
```
