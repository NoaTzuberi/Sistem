# Design update — Portion tracking, Workout logs, Nutrition builder fixes, AI draft banner (apps/dashboard)

Date: 2026-10-15. Reference: `docs/design/coach-dashboard.html` (visual reference only; nothing was
copied from its code).

## Summary

1. **Portion tracking** on the trainee's Nutrition tab is a card:
   - a week navigator;
   - four weekly rings in the portion colors;
   - seven day cards that open to the day's meals and photos;
   - a legend of the daily goal.
2. **The Workout logs tab** is rebuilt:
   - four summary tiles and a filter;
   - logs grouped by day, as glass cards that open smoothly to exercises, her note and photo.
3. **The nutrition builder** gets:
   - roomier steppers;
   - one "התחלה מתבנית ▾" menu;
   - a redesigned food-items box with a glass food search;
   - the AI draft moved out of the sidebar into a banner above step 1 (apply / undo / dismiss).

No server change and no dependency. Every number comes from data the dashboard already loads.

## 1. Portion tracking (`features/nutrition`)

Components: `PortionTrackingCard`, `WeekNavigator`, `WeeklyPortionRing`, `DayPortionCard`, and
`DayPortionDetails` (the opened day). Hook: `usePortionTracking`.

- **Header:** "מעקב מנות" with a subtitle. Round ‹ › buttons around "11–17 באוק׳"; next is disabled
  on the current week.
- **Weekly rings** (protein, carbs, fat, snack): the week's marked portions vs planned, on a tile in
  the group color ("9½ / 21", isolated).
- **Day cards:**
  - day name, date, four thin bars (marked / the day's goal), and the total "x / y";
  - a photo-count chip when she added meal photos;
  - today: a pink ring and "היום";
  - nothing marked: striped "לא סומן דבר";
  - still to come: dashed "עדיין לא";
  - a day with no live plan: quiet "אין תוכנית" (existing wording).

  Seven columns, and under 1000 px they scroll inside their row.
- **Opening a day:** a day that has marks or photos is a button (lifts 3 px under a fine pointer).
  It opens the day: marked of planned per group, and the day's meals with her photos (1-hour signed
  links, as before). Other days are not clickable.
- **Legend:** "[group] · N ביום", from the plan live on the latest day that has one.

## 2. Workout logs tab (`features/trainees`)

Components: `WorkoutLogSummary`, `WorkoutLogFilters`, `WorkoutLogDayGroup`, `WorkoutLogCard`,
`WorkoutLogDetails`. Hook: `useWorkoutLogs`. `WorkoutLogList` is now the tab's shell.

- **Summary:** אימונים · השבוע (her week, her zone) · דירוג ממוצע · שיאים אישיים — the statistics
  page's `StatTile`, reused.
- **Filter:** הכול · N / שיאים · N / עם תמונה · N — the shared `RangeSegmented`, reused.
- **Day groups:** a small muted date per day, in her zone.
- **Card** (glass, radius 22):
  - a 12 px strip in the workout's identity color;
  - the name (`dir="auto"`, isolated), time and duration;
  - a status pill: הושלם (Cherry Rose soft), חלקי (amber: finished with sets not done), בתהליך (grey);
  - the rating as 5 amber dots;
  - "שיא אישי" as a blue gradient pill with a trophy;
  - the photo thumbnail;
  - a round chevron that turns.
- **Opening:** `grid-template-rows` 0fr → 1fr in 280 ms. One card open at a time; `aria-expanded`
  and `aria-controls`; the closed body is `inert`.
- **Inside a card:**
  - the workout's numbers (duration, volume, sets done);
  - one row per exercise: name, "3×10 · 40 ק״ג", and every set below it so no data is lost;
  - a record row tinted blue with "שיא" and the existing record sentence;
  - a side column with her note (warm card) and the photo.
- **Empty states:** the existing "עדיין אין תיעודי אימונים." when she has none; a line when a
  filter leaves nothing.

## 3. Nutrition builder fixes

- **a. Steppers:**
  - a meal's portion pill is 44 px, 14 px on the label side and 6 px on the button side, with a
    4 px gap and 32 px buttons;
  - a food item's stepper is 40 px with 4 px padding, 32 px buttons and "מנות" inside.
- **b. Template picker:** one "התחלה מתבנית ▾" pill (40 px, the chevron turns).
  - It opens a glass menu (radius 20, scales in 180 ms) with the amber "הארוחות הנוכחיות יוחלפו" and
    one row per template ("N ארוחות · kcal").
  - Choosing one applies it, after a confirm when the meals have content (portions or options).
  - Esc and a press outside close it.
- **c. Food items** (`OptionPanel`): a white box "אפשרות א׳ · מה היא אוכלת" with an item count.
  - **Food rows:** the group tag in its color; the name in bold, with the part in brackets muted;
    the amount line; the stepper; and a round × that tints red on hover.
  - **Free vegetables:** a "ירקות · ירקות חתוכים · חופשי" row while the toggle is on.
  - **Text rows:** an icon, an inline input, the "counts as" select, and ×.
  - **Buttons:** "+ פריט מזון" (pink-soft, pink while open) and "+ שורת טקסט".
  - **The food search** (`FoodPicker`) is a glass popover over the same catalog. It keeps the group
    tabs, category chips, typo-tolerant search, recently used row and the keyboard (↑ ↓ Enter Esc).
    Rows show a group color dot, the name, the amount and the category. A pick adds 1 portion.
    A press outside closes it.
  - **On a phone:** the name takes its own row, with the stepper and × under it.

## 4. AI draft banner

Components: `AiDraftBanner`, `AiDraftCompact`. Hook: `useAiDraftBanner`. The old `AiDraftCard` is deleted.

- **When a draft is ready**, a banner sits above step 1:
  - a white card with a lilac / pink cloud and a lilac hairline;
  - a 42 px gradient sparkle tile, "טיוטת AI מוכנה", and "N ארוחות · date, time · model" (model LTR);
  - dismiss ×;
  - the kcal on a dark pill with "±X מהיעד" (when a target is set);
  - protein / carbs / fat chips;
  - the summary clamped to 2 lines with "קריאה מלאה / פחות" (`dir="auto"`);
  - "לבדוק ידנית, לא נבדק בקוד: …" as an amber strip (her free-text answers, when there are any);
  - "החלה על התוכנית" (pink) and "יצירה מחדש" (the existing endpoints).
- **Apply** uses the existing load (it asks first when the meals have content). The banner then
  reads "טיוטת ה-AI הוחלה על התוכנית" on a Cherry Rose hairline, with "ביטול ההחלה". Undo puts back
  the meals, target and link as they were just before — this visit only.
- **When it is dismissed** (remembered per trainee and draft, in this browser), **or when there is no
  draft**, the sidebar shows a compact card:
  - make a draft, or a new one / try again;
  - the progress while it runs, or why it cannot;
  - "טיוטת AI מוכנה" to show a hidden draft again.

  The draft's reasoning panel stays in the sidebar while the plan uses a draft.

## Hidden — no data source

- **"דולג" (skipped) on a log card:** skipped workouts are not logs, and abandoned logs are hidden
  by the server. A log is הושלם, חלקי or בתהליך.
- **The workout identity color by its place in the plan:** a log does not know its place. The color
  comes from the workout id, so the same workout keeps the same color.
- **Icon squares on the summary tiles:** the shared `StatTile` was reused as asked; it has its
  colored cloud, no icon.
- **What she marked per meal:** marks are stored per day, so the day details list the meals
  (and their photos) and the per-group totals.

## Decisions — please check

1. **"Partial"** = finished with at least one set not done.
2. **The average rating** has one decimal.
3. **Each exercise row** shows the done sets × their most common reps (or hold) and the heaviest weight,
   with every set listed under it.
4. **The template confirm and the AI apply confirm** now ask only when the meals have content (portions
   or options), not whenever a meal exists.
5. **The AI banner's dismissal** is remembered in this browser only; undo lasts for this visit.

## i18n keys (he + en; English is placeholder; PLACEHOLDER lines wait for the owner)

- **nutrition `builder.*`:** `templateButton`, `templateNote`, `templateEmpty`, `optionFoods`, `itemCount`,
  `vegetablesTag`, `vegetablesLine`, `addFoodItem`, `aiReady`, `aiDismiss`, `aiKcalDiff`, `readMore`,
  `readLess`, `checkManually`, `aiApply`, `aiApplied`, `aiUndo`.
- **nutrition `tracking.*`:** `subtitle`, `previousWeek`, `nextWeek`, `today`, `weekRing`, `photos`, `perDay`, `openDay`, `dayMeals`.
- **trainees `logs.*`:** `workouts`, `averageRating`, `filterLabel`, `filterAll`, `filterPrs`, `filterPhoto`,
  `partial`, `prPill`, `prRow`, `rating`, `herNote`, `setsReps`, `noneFiltered`.

## Files

Added:
- `features/nutrition/components/`: AiDraftBanner, AiDraftCompact, PortionTrackingCard, WeekNavigator,
  WeeklyPortionRing, DayPortionCard, DayPortionDetails (each `.tsx` + `.css`)
- `features/nutrition/hooks/useAiDraftBanner.ts`, `usePortionTracking.ts`
- `features/trainees/components/`: WorkoutLogSummary, WorkoutLogFilters (`.tsx` only — it reuses
  `RangeSegmented`'s styles), WorkoutLogDayGroup, WorkoutLogCard, WorkoutLogDetails
- `features/trainees/hooks/useWorkoutLogs.ts`
- this report

Modified:
- `features/nutrition/components/`: NutritionEditor, FoodPicker, OptionPanel, PortionStepper,
  TemplatePicker, TraineeNutritionTab
- `features/nutrition/copy/{he,en}.ts`
- `features/trainees/components/WorkoutLogList/` (now the tab's shell)
- `features/trainees/pages/TraineeDetailPage/TraineeDetailPage.tsx` (passes her zone and week)
- `features/trainees/copy/{he,en}.ts`

Deleted:
- `features/nutrition/components/AiDraftCard`, `TrackingWeek`

**Still uncommitted from the last round** (the nutrition builder), included in commit 1 below:
`NutritionEditor`, `CalcEquation`, `PortionBudgetCard`, `MessageTipsSection`, and
`docs/phase-reports/design-nutrition-builder.md`.

## Not mine — please look

- **`WorkoutLogList.tsx` / `.css` already had uncommitted changes** (14 Oct 14:28, after the last
  commit) when I rebuilt the tab. They imported `@tabler/icons-react`, which is not a dashboard
  dependency. The new tab replaces those files.
- **`TraineeDetailPage.tsx` also has another uncommitted change:** the logs tab left its white card,
  which fits the new tab. Commit 3 takes the whole file.
- **`features/trainees/copy/he.ts` / `en.ts` hold one more uncommitted line, `startingPhoto`** (the
  starting-photo work). Commit 3 takes the whole files; the key is harmless on its own.
- **Other uncommitted work is not in these commits:** `ProgressPhotosCard`, `usePhotoCompare`,
  `TraineeDetailPage.css`, `apps/mobile/**`, `docs/design/coach-dashboard.html`,
  `docs/phase-reports/starting-photo.md`.
- **The four untracked leftovers from 14 Oct are still there:**
  `features/nutrition/components/{CalculationSummary,IntroEditor,MealEditor,TipsEditor}`. Nothing uses
  them; delete them (see the nutrition builder report).

## How to test

```bash
npm run build     # passes
npm run lint      # passes; the i18n audit is clean
npm test          # passes: server 42 files / 601 tests, copy + client 3 files / 30 tests
npm run dev:all
```

Checked in headless Chrome against the local server. **Every write was blocked** (none were
attempted), so nothing reached the dev database.

- **Logs:** 5 logs → tiles 5 / 0 / 3.0 / 1; filters "הכול · 5 / שיאים · 1 / עם תמונה · 2"; one
  "חלקי" log. Opening shows the exercises; opening a second closes the first. The records filter
  leaves 1. A trainee without logs gets the empty line.
- **Tracking:** this week shows 4 days not marked and 2 to come, with "היום" on today and next
  disabled. The previous week is "4–10 באוק׳", next enabled, with days that had no plan. (No dev
  trainee has marks, so opening a day was not exercised.)
- **Builder:**
  - the banner shows the draft's kcal and portion chips;
  - apply → "הוחלה" with "ביטול ההחלה" → undo brings the banner back;
  - dismiss → the compact card with "טיוטת AI מוכנה";
  - the template menu opens (the dev coach has no templates: "אין עדיין תבניות.") and Esc closes it;
  - a food search with no match says "אין פריטים מתאימים.";
  - the new food-items box at 1440 and 390 px.
- **English, 390 px:** no horizontal scroll anywhere (the day cards scroll inside their row).
- No console errors.

Not checked: opening a day with marks or photos and applying a real template (no such dev data);
Safari, Firefox and a real touch device. Reduced motion is in the CSS for every new transition and
animation, but was not exercised in the browser this round.

## Suggested commits

1. `feat(dashboard): nutrition builder — template menu, food-items box, steppers, AI draft banner`
2. `feat(dashboard): portion tracking card — weekly rings, day cards, day details`
3. `feat(dashboard): workout logs tab — summary, filters, day groups, opening cards`
4. `docs: tracking, workout logs and builder fixes report`

```bash
git add -A -- apps/dashboard/src/features/nutrition/components/NutritionEditor apps/dashboard/src/features/nutrition/components/CalcEquation/CalcEquation.tsx apps/dashboard/src/features/nutrition/components/PortionBudgetCard/PortionBudgetCard.tsx apps/dashboard/src/features/nutrition/components/MessageTipsSection/MessageTipsSection.tsx apps/dashboard/src/features/nutrition/components/FoodPicker apps/dashboard/src/features/nutrition/components/OptionPanel apps/dashboard/src/features/nutrition/components/PortionStepper apps/dashboard/src/features/nutrition/components/TemplatePicker apps/dashboard/src/features/nutrition/components/AiDraftBanner apps/dashboard/src/features/nutrition/components/AiDraftCompact apps/dashboard/src/features/nutrition/components/AiDraftCard apps/dashboard/src/features/nutrition/hooks/useAiDraftBanner.ts apps/dashboard/src/features/nutrition/copy/he.ts apps/dashboard/src/features/nutrition/copy/en.ts docs/phase-reports/design-nutrition-builder.md
git commit -m "feat(dashboard): nutrition builder — template menu, food-items box, steppers, AI draft banner"

git add -A -- apps/dashboard/src/features/nutrition/components/PortionTrackingCard apps/dashboard/src/features/nutrition/components/WeekNavigator apps/dashboard/src/features/nutrition/components/WeeklyPortionRing apps/dashboard/src/features/nutrition/components/DayPortionCard apps/dashboard/src/features/nutrition/components/DayPortionDetails apps/dashboard/src/features/nutrition/components/TrackingWeek apps/dashboard/src/features/nutrition/components/TraineeNutritionTab/TraineeNutritionTab.tsx apps/dashboard/src/features/nutrition/hooks/usePortionTracking.ts
git commit -m "feat(dashboard): portion tracking card — weekly rings, day cards, day details"

git add -A -- apps/dashboard/src/features/trainees/components/WorkoutLogList apps/dashboard/src/features/trainees/components/WorkoutLogSummary apps/dashboard/src/features/trainees/components/WorkoutLogFilters apps/dashboard/src/features/trainees/components/WorkoutLogDayGroup apps/dashboard/src/features/trainees/components/WorkoutLogCard apps/dashboard/src/features/trainees/components/WorkoutLogDetails apps/dashboard/src/features/trainees/hooks/useWorkoutLogs.ts apps/dashboard/src/features/trainees/pages/TraineeDetailPage/TraineeDetailPage.tsx apps/dashboard/src/features/trainees/copy/he.ts apps/dashboard/src/features/trainees/copy/en.ts
git commit -m "feat(dashboard): workout logs tab — summary, filters, day groups, opening cards"

git add -A -- docs/phase-reports/design-tracking-logs-builder-fixes.md
git commit -m "docs: tracking, workout logs and builder fixes report"
```

Commit 1 also finishes the last round's builder, so the dashboard builds again from a clean checkout.
