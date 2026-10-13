# Design update — trainee "Plans" tab (active trainee), toolbar, and the "New plan" popover

Reference: `docs/design/coach-dashboard.html` → an active trainee → "תוכניות" (visual reference
only; none of its names, numbers or weeks were shipped).

## Read this first — the last commits left files behind

`git status` shows that files from the plan-builder rounds were never committed, while code that
imports them was (the trainee-profile commit took the whole `features/planBuilder` and
`features/aiDraft` folders):

- `apps/dashboard/src/components/common/PillButton/`, `ActionMenu/`, `SideSheet/`, `Toast/`
- `apps/dashboard/src/hooks/useToast.ts`
- `apps/dashboard/src/components/common/Icon/iconPaths.ts` and `app/config/routes.ts` (modified)
- `scripts/plan-builder.test.ts`, `vitest.i18n.config.mts`, `docs/phase-reports/design-plan-builder.md`

So the committed tree does not build on a clean checkout (missing imports). The first commit
below takes exactly these files; run it before anything is pushed or deployed.

## Summary

For a trainee who has plans, the Plans tab is now: a three-pill toolbar, "this week" as the main
card (progress ring, workouts with their identity colors and statuses), "next week" beside it,
and the other weeks as a quiet timeline. Every way of starting a plan — the three pills, the
header's pink pill, the cards' buttons, the AI sheet, the links from the top line and the builder
— opens one "New plan" popover (week tiles + start method) instead of the radio-list dialog. No
server, API, schema or dependency change.

## Your two answers (asked before the work)

1. **"מאוחר יותר…" is dropped.** The popover offers this week and the next three; the server's
   weeks 5–8 are no longer reachable from the dashboard (nothing changed on the server).
2. **Default = the first free week** (not the server's `defaultNewWeek`). A taken week stays
   visible as a tile and opens its plan.

## What changed

**Toolbar** (`PlansToolbar`) — three 44px pills: "תוכנית חדשה" (pink), "שכפול השבוע שעבר" (white,
soft shadow), "טיוטת AI" (pink → lilac). Under a fine pointer: 1px lift, a deeper shadow, the
icon turns pink, the pink pill darkens a little. Press = scale(0.97). Each opens the popover with
its own start method preselected.

**This week** (`ThisWeekCard`, ~60%) — pink / peach cloud; "השבוע" + status tag; the title; the
subline (dates · workouts · exercises); a 112px ring with the completion % and "X מתוך Y"; the
workouts with a dot in their identity color, name, and "בוצע · יום …" (Cherry Rose) / "מתוכנן ·
יום …" / "פוספס · יום …"; and "פתיחה בבונה". A draft shows no ring (it has no completions), the
pink "עוד לא פורסם…" note and "המשך עריכה ופרסום". No plan this week: a short empty card with
"תוכנית חדשה".

**Next week** (`NextWeekCard`) — "שבוע הבא", the title, the dates, "עוד X ימים", chips for its
workouts in their colors. Draft: the pink note "עוד לא פורסם. {name} לא תראה אותו עד שתפרסמי." and
"המשך עריכה ופרסום". Published: "פתיחה בבונה". None: an empty state whose button opens the popover.

**Other weeks** (`WeekTimeline`, translucent white) — "שבועות קודמים": a dot, the date range, what
the plan is, an arrow into the builder; the row turns white under the pointer. Plans further ahead
than next week get the same timeline titled "שבועות הבאים", with their status.

**"New plan" popover** (`NewPlanPopover` + `useNewPlanPopover`)
- Hangs under the toolbar at the reading-start side, `min(520px, 100vw − 32px)`, radius 26; grows
  from its corner (opacity + scale 0.96 → 1, 180ms, the ease-out curve); opacity only under
  reduced motion.
- Header: "תוכנית חדשה", "לאיזה שבוע, ואיך להתחיל?", ✕.
- **Week** — 4 tiles (radiogroup) from the server's week list: "השבוע" / "שבוע הבא" / "בעוד
  שבועיים" / "בעוד 3 שבועות", the dates, and פנוי (grey) / טיוטה (dark amber) / פורסמה (Cherry
  Rose). Selected = white, pink border, soft pink shadow. Default = the first free week.
- **How to start** — 3 options (radiogroup) with one-line hints: מאפס · שכפול השבוע שעבר ("מעתיק
  את התוכנית של {week}" — the server says which week; disabled with "אין תוכנית קודמת להעתיק
  לשבוע הזה" when there is none) · טיוטת AI (its workout count; disabled without a ready draft).
  Selected = dark border.
- **A taken week**: the options are disabled, an amber note "לשבוע הזה כבר יש תוכנית ({status}) —
  נפתח אותה.", and the button reads "פתיחת התוכנית הקיימת" and opens that plan.
- Buttons: full-width pink "יצירת תוכנית ל־{range}" (the existing create call, then the builder —
  with the AI draft loaded when that method is chosen) and "ביטול".
- Closes on Esc, a press outside, ✕. On open the selected week takes the focus; on close the
  focus returns to what opened it. Arrow keys move inside each radiogroup (following the screen
  in right-to-left).
- ≤ 640px: the week tiles are 2 × 2, the start options one column.

**Trainee without plans** — unchanged layout (AI card + "from scratch"), but its buttons now open
the same popover.

## Not rendered — no data source

1. **Past weeks: the per-workout squares and the completion %.** The coach's plan list carries no
   per-workout status; the dashboard only receives statuses for *this week's published plan*.
   Deriving "done / skipped" for old weeks in the browser from workout logs would copy the
   server's status rule into the client, which the project forbids. A small read-only addition to
   the coach plan list (status per workout, from the existing status code) would fill this — say
   if you want it.
2. **A plan title like "שבוע 6 · עליון / תחתון".** Plans have no title and there is no program-week
   counter. The title is the plan's split when it follows one, otherwise its dates.
3. **"עוד X ימים" without a published plan this week.** The number comes from the server's "days
   left" of this week's plan (+1); when there is none it is left out rather than computed from
   the browser's clock.
4. **The ring for a draft** — a draft has no completions.

## Decisions I made — please check

1. **"פוספס"** is shown for a missed workout of this week (the server's third status); the brief
   named only done / planned.
2. **Plans beyond next week** (a rare case) appear in a second timeline, "שבועות הבאים", so no
   existing plan disappears from the tab.
3. **"אפשרויות חלוקה אחרות"** — a small link in the popover — opens the AI draft sheet (split cards,
   explanation, regenerate), because the "טיוטת AI" pill now opens the popover. From the sheet,
   "use the full plan" / "split only" come back to the popover with that start kept.
4. **A method the chosen week cannot use** (duplicate with nothing to copy, AI without a draft)
   falls back to "מאפס" instead of leaving nothing selected.
5. **When all four weeks are taken** the first is selected (it opens its plan).
6. **"Next week" uses the existing wording "שבוע הבא"** (the shared text), not "השבוע הבא".
7. **The header's pink pill** still goes straight to next week's plan when an active trainee has
   one; otherwise it opens the popover.
8. **Workout identity colors** come from the existing `workout-color-N` classes (the same custom
   properties as in the builder) — no inline style was needed.
9. Hover transitions name their properties (`transform`, `box-shadow`, `background-color`,
   `color`) — never `all`; the press is transform only.

## Removed

- `WeekPicker` (.tsx + .css) — the radio-list dialog, including "מאוחר יותר…" (your decision).
- `PlanWeekRow` (.tsx + .css) — the generic week rows.
- `hooks/usePlanCreation.ts` → `useNewPlanPopover.ts`.
- Copy keys no longer used: `pickNewTitle`, `pickDuplicateTitle`, `later`, `weekTaken`, `openPlan`,
  `createPlan`, `duplicate`, `open`, `planEnded`.

## New tokens (`packages/tokens/tokens.css`)

`--color-primary-hover`, `--gradient-ai-soft`, `--gradient-ai-soft-hover`, `--gradient-week-cloud`,
`--surface-timeline`, `--shadow-pill-hover`, `--shadow-button-hover`, `--shadow-selected`,
`--transition-popover` (180ms), `--transition-hover` (180ms). The amber of the note and of the
"draft" status is the existing `--color-flag` / `--color-flag-soft` pair.

## i18n keys — `features/trainees/copy` (he + en; English is placeholder)

`pastWeeks`, `laterWeeks`*, `workoutDone`, `workoutPlanned`, `workoutMissed`, `statusOnDay`,
`openInBuilderShort`, `notPublishedNote`, `continueAndPublish`, `noPlanNextWeek`*, `startsIn`
(plural), `newPlanSubtitle`, `weekGroup`, `howToStart`, `inWeeks` (plural), `weekFree`,
`startScratch`, `weekTakenNote`, `openExisting`, `createFor`.
\* = my placeholder wording; the rest is the brief's / the reference's Hebrew.

## Files

Added (each component = `.tsx` + `.css` in its own folder)
- `apps/dashboard/src/features/trainees/components/`: `PlansToolbar/`, `ThisWeekCard/`,
  `NextWeekCard/`, `WeekTimeline/`, `ProgressRing/`, `NewPlanPopover/`
- `apps/dashboard/src/features/trainees/hooks/`: `useNewPlanPopover.ts`, `useRadioGroupKeys.ts`
- `apps/dashboard/src/features/trainees/data/planWeeks.ts`
- `docs/phase-reports/design-trainee-plans-tab.md`

Modified
- `packages/tokens/tokens.css`
- `features/trainees/components/TraineePlans/` (.tsx + .css), `copy/he.ts`, `copy/en.ts`

Deleted
- `features/trainees/components/WeekPicker/`, `components/PlanWeekRow/` (.tsx + .css each),
  `hooks/usePlanCreation.ts`

Also still uncommitted from the previous round (the questionnaire color pass): `GoalCard/`,
`KeyNumbers/`, `AnswerSection/`, `OnboardingAnswers.tsx`, `questionnaireProfile.ts`, the deleted
`WeightGoalBar/`, and `docs/phase-reports/design-trainee-profile.md`.

## Dependencies

None added or removed.

## How to test

```
npm run build -w @sistem/dashboard   # passes
npm run lint                         # passes (i18n audit clean; the known fast-refresh warnings)
npm run test:i18n                    # passes (29)
npm run dev:all                      # http://localhost:5174, seed coach: coach@sistem.dev
```

1. **Active trainee with a draft for next week** (Dev Trainee Two) — this week: tag, title,
   subline, ring "0% · 0 מתוך 1", the workout with its dot and "מתוכנן"; next week: "פול באדי ·
   טיוטה", dates · "עוד N ימים", three colored chips, the pink note, "המשך עריכה ופרסום" → the
   builder; "שבועות קודמים" with an arrow per row.
2. **Draft this week** (Dev Trainee One) — no ring, the pink note, "המשך עריכה ופרסום".
3. **No plan for next week** — the side card's empty state; its button opens the popover.
4. **Toolbar** — hover each pill with the mouse (lift, shadow, pink icon; the pink one darkens);
   press (shrinks); each opens the popover on its own method.
5. **Popover** — four tiles with labels, dates and statuses; the first free week is selected and
   focused; choose a taken week: the options grey out, the amber note, "פתיחת התוכנית הקיימת" →
   that plan; choose a free one: "יצירת תוכנית ל־…" → creates → the builder (with "טיוטת AI": the
   draft is loaded; with "שכפול": last week's workouts).
6. **Only one past week / nothing to copy** — "שכפול השבוע שעבר" is disabled with its reason, and
   the popover opened from that pill falls back to "מאפס".
7. **Keyboard only** — Tab to a pill, Enter: focus is on the selected week; ← → move between the
   weeks, Tab to the start options, ← → between them, Tab to the buttons; Esc closes and the
   focus is back on the pill.
8. **Closing** — Esc, a click outside, ✕, "ביטול".
9. **AI** — the "אפשרויות חלוקה אחרות" link → the AI sheet → "שימוש בתוכנית ה-AI המלאה" → the popover
   again with "טיוטת AI" selected.
10. **From elsewhere** — the top line's "תוכנית חדשה" → pick her; the builder's ⋯ → "שכפול השבוע
    שעבר"; the header's pink pill: all open the popover (the last one goes to next week's plan
    when it exists).
11. **Trainee without plans** — the AI card's "פתיחה בבונה התוכניות" and "תוכנית מאפס" open the popover.
12. **390px** — the two cards stack, the ring is above the workouts, the timeline shows dates +
    arrow only, the popover is inside the screen with 2 × 2 weeks and stacked options, no sideways
    scroll.
13. **he ↔ en** — mirrored; the popover hangs from the other side; ← → follow the screen.
14. **Reduced motion** — the popover only fades; no lift, no press.

Checked here, in Chrome as the seed coach (scripted clicks after hit-testing every control of the
tab — none covered): 1; 2 (Dev Trainee One: draft this week, published next week); 5 (tiles,
default, taken week, labels; one plan really created from scratch for 1–7 Nov and deleted again
from the builder); 7 (focus on open, arrows in both groups, Esc + focus back); 8; 9 (the link
opens the sheet and closes the popover); the popover's position (under the bar, reading-start
side, 520px); 12 in a 390px frame (stacking, 2 × 2, single column, popover within 16–374px).
**Not checked:** 3 and 6 (no seed trainee is in those states — the code paths are the disabled /
empty branches); 4's hover with a real pointer; creating with "שכפול" or "טיוטת AI"; 10, 11, 13
(English), 14; real pointer clicks; Safari / Firefox; the server test suite (no server file
changed).

## Known issues / TODOs

1. The four "not rendered" items and the nine decisions above.
2. The popover is anchored to the toolbar: opened from a button further down the page (the
   next-week card) on a short screen, it can be above the fold — the page does not scroll to it.
3. The duplicate hint names the week it copies from; for a week two ahead that can be next week's
   *draft* — the server's existing rule, now visible.
4. CLAUDE.md still describes the WeekPicker ("never skips a taken week — it offers Open") and the
   8-week list — say if you want it updated to the popover and your two decisions.
5. Not mine, left untouched: `apps/dashboard/package.json`, `package-lock.json`,
   `apps/server/.env.example`, `packages/api-client/src/createApiClient.ts`,
   `docs/design/coach-dashboard.html`, `apps/mobile/**`.

## Suggested commits

1. `fix(dashboard): add the shared components and files the plan builder imports` — the files left
   behind (see the top of this report)
2. `feat(dashboard): questionnaire color pass — key tiles, goal card, section colors`
3. `feat(dashboard): plans tab — this week / next week / timeline and the new-plan popover`
4. `docs: plan builder, trainee profile and plans tab reports`

```
git add -A -- apps/dashboard/src/components/common/PillButton apps/dashboard/src/components/common/ActionMenu apps/dashboard/src/components/common/SideSheet apps/dashboard/src/components/common/Toast apps/dashboard/src/components/common/Icon/iconPaths.ts apps/dashboard/src/hooks/useToast.ts apps/dashboard/src/app/config/routes.ts scripts/plan-builder.test.ts vitest.i18n.config.mts
git commit -m "fix(dashboard): add the shared components and files the plan builder imports"

git add -A -- apps/dashboard/src/features/trainees/components/GoalCard apps/dashboard/src/features/trainees/components/KeyNumbers apps/dashboard/src/features/trainees/components/AnswerSection apps/dashboard/src/features/trainees/components/OnboardingAnswers apps/dashboard/src/features/trainees/components/WeightGoalBar apps/dashboard/src/features/trainees/data/questionnaireProfile.ts
git commit -m "feat(dashboard): questionnaire color pass — key tiles, goal card, section colors"

git add -A -- apps/dashboard/src/features/trainees packages/tokens/tokens.css
git commit -m "feat(dashboard): plans tab — this week / next week / timeline and the new-plan popover"

git add -A -- docs/phase-reports/design-plan-builder.md docs/phase-reports/design-trainee-profile.md docs/phase-reports/design-trainee-plans-tab.md
git commit -m "docs: plan builder, trainee profile and plans tab reports"
```

Commit 2 alone does not build (its copy keys and tokens are in commit 3's files) — commits 2 and
3 belong together; squash them if every commit must build. `vitest.i18n.config.mts` in commit 1
lists `scripts/api-client.test.ts`: commit that file (your earlier work) with it if it is still
untracked.
