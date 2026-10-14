# Design update — Trainee quick-view drawer: full redesign (apps/dashboard)

Date: 2026-10-14. Reference: `docs/design/coach-dashboard.html` → "כל המתאמנות" → a row (visual
reference only; nothing was copied from its code).

## Summary

The quick-view drawer is rebuilt as `TraineeQuickView` with the reference's layout:
- a centered hero colored by status;
- a spotlight card with a ring (the 48-hour window, or this week's workouts);
- an AI-draft strip;
- four colored fact tiles;
- a questionnaire snippet;
- an iOS-style grouped list of her profile sections, replacing the old tab bar that only linked away;
- a sticky glass footer with a pink primary button.

Every number and label comes from data the dashboard already has. One small read-only field was
added on the server: each workout's planned day. The drawer keeps its position, size and motion.
Esc and the scrim close it, Tab stays inside it, and focus returns to the row that opened it.

## What each part does

1. **Shell** (`TraineeQuickView`)
   - Same place and size as before, with background `--color-quick-view-bg` (#F7F5F7).
   - The body scrolls and the footer stays.
   - A 38 px glass close button sits at the top inline-end corner.
   - It opens in 300 ms on the drawer curve and closes in 200 ms.
   - The content is keyed by trainee, so every open starts at the top and the ring fills again.
2. **Hero** (`QuickViewHero`)
   - A two-blob cloud by `data-status`: waiting pink + peach, active lilac + pink, attention amber, idle grays.
   - A 76 px gradient avatar with a white ring and a tinted shadow.
   - Name at 28 px / 500, then a white status pill with a colored dot and her last activity.
3. **Spotlight** (`StatusSpotlight`)
   - **Waiting, inside the window:** the ring fills by elapsed / 48 h, with 'H:MM' left in its center, and "נותרו … שע׳".
   - **Waiting, late:** a full ring with "!", a pink tint and a pink hairline, and "באיחור של …" in Cherry Rose.
   - **Active:** the ring shows done / planned with "3/4" in its center, and one tile per workout:
     - the letter A, B, C… in that workout's identity color;
     - "בוצע" on a tint when done;
     - the planned day when upcoming ("—" without a day);
     - striped "דולג" when skipped.
   - **Attention:** the same as active in amber, titled "N אימונים דולגו השבוע".
   - **Idle:** an empty gray ring with "—" and "התוכנית הסתיימה".
   - The ring fills on open (900 ms ease-out), except under reduced motion.
   - The countdown recomputes once a minute from the server clock.
4. **AI strip** (`AiDraftStrip`, waiting only, when a ready draft exists): "טיוטת AI מוכנה",
   "[split] · N ימים · רק את רואה אותה", and "פתיחה". It opens her Plans tab with the new-plan
   week picker already set to "from the AI draft"; creating the plan loads the draft into the builder.
5. **Facts** (`QuickFacts`):
   - מטרה (pink);
   - ימים בשבוע (purple);
   - תוכנית (orange; "עוד אין" when she has no plan);
   - התמדה (blue; this week's done / planned, "—" without a plan).

   Each tile has a corner cloud and lifts 2 px under a fine pointer.
6. **Questionnaire** (`QuestionnaireSnippet`, waiting only):
   - "מהשאלון", then her preferred activities and days per week, joined from existing labels;
   - an amber "⚠" chip with her first recovery limitation or note (+N when there are more);
   - hidden when she answered neither.
7. **Profile links** (`ProfileLinksList`):
   - "בפרופיל המלא", one 50 px row per tab: תוכניות, תיעודי אימונים, גוף, תזונה, שאלון, הישגים (the existing drawer order);
   - each row has a colored icon square, the label, a count where one exists, a chevron, and hairlines inset after the icon;
   - a click closes the drawer and opens her profile on that tab.
8. **Footer** (`QuickViewFooter`): "פרופיל מלא" (a white pill) and a pink primary that fills the
   rest. The primary is "בניית התוכנית" when waiting, "לתוכנית של השבוע" when active or attention,
   and "תוכנית חדשה" otherwise. Either button closes the drawer and navigates.

**Hooks:**
- `useTraineeQuickView(trainee)`: her status for the drawer, the window, the plan count, and — only
  when she is waiting — her answers and the latest AI draft.
- `useWindowCountdown(planDueAt, nowMs)`.

**Drawer context:** `openProfile(traineeId, tab?, state?)` in `useTraineeDrawer` closes the drawer
and goes to her profile on that tab.

## Omitted (no data source)

- **The round message button in the footer.** The app has no messaging feature, so the button
  would do nothing. It is not built.
- **Counts on the links other than Plans.** Plans is the only count the profile page has; logs,
  body, nutrition and achievements would each need another request when the drawer opens.

## Decisions I made — please check

1. **"Attention" is not a server status.** The drawer shows it when she is active and a workout
   of this week was already skipped (its day passed without it — the same "missed" as the week
   board). Her pill still reads the existing label "פעילה", with an amber dot.
2. **A "new" trainee** (not through the questionnaire yet) gets the gray look; the spotlight says
   her status label ("חדשה") instead of "התוכנית הסתיימה", and the primary is "תוכנית חדשה".
3. **The questionnaire summary is labels, not a sentence** ("חדר כושר / אימוני כוח, ריצה · 3–4
   ימים בשבוע"): the reference's sentence would be new wording.
4. **Hebrew needs a "two" form** for "N אימונים דולגו": I wrote "שני אימונים דולגו השבוע" (DRAFT),
   and "אימון אחד דולג השבוע" for one. The design shows only the plural.
5. **"פתיחה" opens the week picker on "from the AI draft"**, not the builder directly: a plan
   needs a week first. One press more, and the coach chooses the week.
6. **The workout tile shows the full day name** ("יום שישי" / "Friday"). It fits at 390 px.
7. **Reduced motion** also drops the drawer slide (it appears in place), not only the ring fill.

## Server (read-only, no schema change)

`CoachWeekPlan.workouts[]` gained `dayOfWeek: number | null` (`coachStats.ts`, `@sistem/types`) for
the "planned day" under an upcoming workout. There is 1 new test.

## New tokens (`packages/tokens/tokens.css`)

- **Colors:** `--color-quick-view-bg`; `--color-qv-{waiting,active,attention,inactive}-*` (cloud, avatar from / to, ink);
  `--color-qv-late-tint`, `--color-qv-hairline`, `--color-qv-row-hover`, `--color-qv-skip-stripe`, `--color-qv-achievements`.
- **Surfaces:** `--surface-qv-close`, `--surface-qv-pill`, `--surface-qv-footer`.
- **Shadows:** `--shadow-qv-lift`, `--shadow-qv-late`.
- **Blurs:** `--blur-qv-glass`, `--blur-qv-footer`, `--blur-qv-cloud`, `--blur-qv-tile`.
- **Motion:** `--transition-qv-ring`.
- **Radii:** `--radius-qv-card`, `--radius-qv-tile`, `--radius-qv-icon`.

The rest reuse the statistics tokens (`--color-stat-*`, `--color-meter-track`) and
`--color-workout-*`.

## i18n keys (`features/trainees/copy`, `quickView.*`; English is placeholder)

`windowLeftText`, `windowLateText`, `weekDone`, `missed` (plural), `planEnded`, `skipped`,
`workoutsLabel` (screen readers, PLACEHOLDER), `aiMeta`, `aiOpen`, `goal`, `daysPerWeek`,
`consistency`, `noPlanYet`, `fromQuestionnaire`, `inFullProfile`, `fullProfile`, `buildPlan`.

Reused: `aiReadyTag`, `done`, `plan`, `openWeekPlan`, `newPlan`, `daysPerWeek`, and the shared status,
time and section labels.

## Files

Added:
- `apps/dashboard/src/features/trainees/components/`: TraineeQuickView, QuickViewHero, StatusSpotlight,
  AiDraftStrip, QuickFacts, QuestionnaireSnippet, ProfileLinksList, QuickViewFooter (`.tsx` + `.css` each)
- `apps/dashboard/src/features/trainees/hooks/useTraineeQuickView.ts`, `useWindowCountdown.ts`
- `apps/dashboard/src/components/common/Avatar/initials.ts` (moved out of `Avatar.tsx`)
- `docs/phase-reports/design-trainee-quick-view.md`

Modified:
- `apps/dashboard/src/features/trainees/hooks/useTraineeDrawer.tsx` (`openProfile`)
- `apps/dashboard/src/features/trainees/components/TraineePlans/TraineePlans.tsx` (the "from the AI draft" entry)
- `apps/dashboard/src/features/trainees/copy/he.ts`, `en.ts`
- `apps/dashboard/src/app/config/routes.ts` (`AI_PLAN_STATE`)
- `apps/dashboard/src/components/layout/AppShell/AppShell.tsx`
- `apps/dashboard/src/components/common/Avatar/Avatar.tsx`
- `apps/dashboard/src/components/common/Icon/iconPaths.ts` (target, calendar, trend, list, utensils, body, clipboard, award)
- `packages/tokens/tokens.css`, `packages/types/src/index.ts`
- `apps/server/src/features/coach/coachStats.ts`, `__tests__/coachStats.test.ts`

Deleted:
- `apps/dashboard/src/features/trainees/components/TraineeDrawer/`

## Dependencies

None added or removed.

## How to test

```bash
npm run build     # passes
npm run lint      # passes (the i18n audit is clean; no new warnings)
npm test          # passes: server 42 files / 601 tests (1 new), copy + client 3 files / 30 tests
npm run dev:all   # then http://localhost:5174/trainees and open a row
```

Checked in headless Chrome against the local server. The list and week answers were rewritten in
the browser so every status shows up:

- **Statuses:** waiting inside the window, waiting late, active, attention, inactive, a long name.
- **AI drafts:** with a draft (real drafts in the dev database) and without one.
- **Questionnaire:** a limitation chip with "+1", and a trainee with no limitation.
- **English:** the drawer moves to the right side, the chevrons flip, and "1/5" and the letters stay LTR.
- **390 px:** the drawer is 366 px wide (full width minus 24 px), with no horizontal scroll.
- **Keyboard:** focus starts on the close button and Tab cycles inside the drawer (links → footer →
  close → …). Esc closes it and the focus is back on the row. A link row closes the drawer and opens
  `?tab=logs`. The active primary opens this week's plan.
- **Reopen:** the body is back at the top.
- **Reduced motion:** no ring animation and no slide.
- No console errors.

Not checked: Safari and Firefox; a real touch device.

## Known issues / TODOs

1. **Not mine, but in a file of this task:** `apps/dashboard/src/features/trainees/copy/he.ts` has an
   uncommitted change from outside this task. `listSubtitle` reads
   `'{active} פעילות · {waiting} מחכות לתוכניתמתאמנות ש'` — it looks like a stray paste, and it shows on
   the trainees page. I left it as it is. The commit below includes the whole file, so fix it first or
   say and I will restore `'{active} פעילות · {waiting} מחכות לתוכנית'`.
2. `packages/tokens/tokens.css` also holds the exercise-library tokens (other uncommitted work);
   commit 2 below takes the whole file.
3. The message button is not built (see "Omitted").

## Suggested commits

1. `feat(server): the planned day of each workout in the coach week data`
2. `feat(tokens): trainee quick-view colors, glass and ring tokens`
3. `feat(dashboard): trainee quick view — status hero, spotlight, facts and profile links`
4. `docs: trainee quick-view design update report`

```bash
git add -A -- packages/types/src/index.ts apps/server/src/features/coach/coachStats.ts apps/server/src/features/coach/__tests__/coachStats.test.ts
git commit -m "feat(server): the planned day of each workout in the coach week data"

git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): trainee quick-view colors, glass and ring tokens"

git add -A -- apps/dashboard/src/features/trainees/components/TraineeQuickView apps/dashboard/src/features/trainees/components/QuickViewHero apps/dashboard/src/features/trainees/components/StatusSpotlight apps/dashboard/src/features/trainees/components/AiDraftStrip apps/dashboard/src/features/trainees/components/QuickFacts apps/dashboard/src/features/trainees/components/QuestionnaireSnippet apps/dashboard/src/features/trainees/components/ProfileLinksList apps/dashboard/src/features/trainees/components/QuickViewFooter apps/dashboard/src/features/trainees/components/TraineeDrawer apps/dashboard/src/features/trainees/hooks/useTraineeQuickView.ts apps/dashboard/src/features/trainees/hooks/useWindowCountdown.ts apps/dashboard/src/features/trainees/hooks/useTraineeDrawer.tsx apps/dashboard/src/features/trainees/components/TraineePlans/TraineePlans.tsx apps/dashboard/src/features/trainees/copy/he.ts apps/dashboard/src/features/trainees/copy/en.ts apps/dashboard/src/app/config/routes.ts apps/dashboard/src/components/layout/AppShell/AppShell.tsx apps/dashboard/src/components/common/Avatar apps/dashboard/src/components/common/Icon/iconPaths.ts
git commit -m "feat(dashboard): trainee quick view — status hero, spotlight, facts and profile links"

git add -A -- docs/phase-reports/design-trainee-quick-view.md
git commit -m "docs: trainee quick-view design update report"
```

If the exercise-library token commit lands first, commit 2 holds only the quick-view tokens.
