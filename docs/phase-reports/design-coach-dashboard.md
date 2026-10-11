# Design update — Coach Dashboard: shell, Overview, Statistics, Trainees (apps/dashboard)

Reference: `docs/design/coach-dashboard.html` (look, layout, motion only — none of its names,
numbers, feed items or charts were shipped).

## Decisions that need your eye first

1. **Chart time axis vs the PRD.** The brief says the time axis runs right → left in Hebrew;
   PRD §11 (Phase 15) says charts keep time left → right in both languages. I followed the
   brief for the new Statistics charts (and the hero mini columns, so every time axis on the
   dashboard reads the same way). The body-tracking charts still follow the PRD. One constant
   switches it back: `TIME_AXIS_FOLLOWS_DIRECTION` in `features/stats/data/chartScales.ts`.
   The PRD text was not changed — say which rule stays.
2. **Overview is a new page too.** The brief says the only new page is Statistics, but section 3
   describes an Overview and the dashboard had none (`/` redirected to the trainees list). It is
   built at `/` and is where a coach lands after login.
3. **The one endpoint also feeds the Overview and the trainees table.** `GET /coach/stats`
   carries the range numbers *and* each trainee's week (board, squares, drawer, ending plans,
   Daily Pump preview). The alternative under "one server change" was two requests per trainee
   from the browser.
4. **No green / amber.** Changes (`+3`) are Cherry Rose, per the standing "no green" token rule.
   The green "weight change" and amber "miss" tags are not built because those feed items do not
   exist (see "Hidden").
5. **Fonts unchanged.** The reference loads Rubik; the tokens still mark the fonts as the
   owner's choice, and changing them would change the mobile app too. Only
   `--font-weight-light` was added.
6. **Rounded cards** follow the approved reference, not PRD §12's sharp cuts. Screens that were
   not redesigned keep their sharp-cut styling inside one white rounded panel.

## What changed

**Shell** — `AppShell` replaces `DashboardShell`: the grey canvas with two pink corner glows, the
sidebar on the canvas (no border), the top line, and what floats above (drawer, ⌘K).
- Sidebar: pink logo tile (full original logo; the existing icon-only asset
  `sistem_mark_transparent.png` on the rail — no new asset, no file edited), quiet group labels,
  white floating pill + pink icon for the current page, grey count on "all trainees", pink count
  on "waiting for a plan" only when there is one. Footer: the existing `LanguageToggle` (still
  saved on the server), avatar + name, and logout (kept from the old top bar — the reference had
  none).
- Collapse → icon rail (icons only, badges as small counters, toggle stacked), remembered per
  browser (`localStorage` key `sistem.dashboard.sidebarCollapsed`).
- Under 860px: off-canvas sheet with a menu button, scrim and Esc.
- Top line: breadcrumb, search pill (⌘K / Ctrl K), the existing notifications panel behind a
  round button with a dot, black "תוכנית חדשה" pill.
- **"New plan"** has no standalone route (the builder is per trainee + week), so the pill opens
  the palette asking for the trainee, then her existing Plans tab with the week picker open.

**Interaction** — page changes and ⌘K are instant. Pressables: `scale(0.97)` on `:active`,
`transform` only, 140ms, `cubic-bezier(0.23,1,0.32,1)`; no `transition: all`. Hover only inside
`(hover: hover) and (pointer: fine)`. Drawer: 300ms `cubic-bezier(0.32,0.72,0,1)` in, 200ms
ease-out out; Esc and the scrim close it; focus returns to the trigger; Tab stays inside.
⌘K: trainees, screens, actions; arrows + Enter; Esc. Reduced motion: no transform transitions.

**Overview** (`/`) — greeting by her clock + week number + date, two inline numbers with their
change; hero "ביצוע אימונים השבוע" (% , "X מתוך Y", 8 mini columns); hero "מחכות לתוכנית" (count,
glass rows with the time left from the server clock, solid pink under 12h, row → drawer); Daily
Pump (signed links only); "השבוע של המתאמנות" (7 days, pills, today line, name → drawer); recent
activity; "תוכניות שנגמרות השבוע".

**Statistics** (`/stats`, new) — range pill 3 / 6 / 12 months; four tiles; area chart, weekly
bars, goal bars, retention + average rating. Own SVG, no chart library. One hue, recessive grid,
2px line, 4px bar tops, hover tooltip on both charts (crosshair on the area chart), axis text in
faint ink, an accessible label plus a screen-reader text list per chart.

**Trainees** — chips with counts (all / new / waiting / active / inactive / needs next week's
plan — the existing statuses; the filter is in the URL so the sidebar can link to "waiting"),
search, white rounded table (avatar, name, goals · days/week; status tag, waiting shows the time
left; this week's plan; squares done / missed / open; last activity). Row click or Enter → drawer.

**Drawer** — avatar, name, status · last activity; pill links to the existing sections; four
facts; this week's squares; footer: "לבניית התוכנית" (no plan this week) or "לתוכנית של השבוע",
and "לפרופיל המלא".

## How each number is computed (all in `apps/server/src/features/coach/coachStats.ts`)

- **Active** = the trainees list's own rule (`resolveTraineeStatus`). A past month-end = had a
  published plan for that week or the next one. Change = now − end of last month.
- **New this month** = sign-ups this month (coach's zone); change = vs last month's sign-ups.
- **This week** = workouts of this week's published plans, done / planned.
- **Average completion (range)** = the same over the range's *ended* weeks only.
- **8 weeks** = per plan week: planned and done.
- **Time to plan** = average hours from onboarding completed to her earliest `publishedAt`, for
  trainees who completed onboarding inside the range (a plan published before onboarding is
  skipped).
- **Goals** = onboarding goals of the active trainees (a trainee can count in several).
- **Retention N months** = of those who finished onboarding ≥ N months ago, who has a published
  plan for a week that far in or later. Not range-dependent.
- **Rating** = average 1–5 of the workouts finished in the range.
- **Board cell** = done: a workout finished that day · planned: a dated open workout today ·
  missed: a dated open workout whose day passed. Workouts without a day are not on the board.
- **Week number** = Sunday weeks, week 1 holds 1 January (11 Oct 2026 = 42; the reference's
  "41" was placeholder).

## The new endpoint

`GET /api/coach/stats?range=3|6|12` — `requireAuth` + `requireRole('coach')`, read-only, no
schema change. Starts from `User.find({ role: 'trainee', coachId })`; plans, logs and onboarding
answers are only looked up by those ids. A missing or unknown `range` reads as 6 (no new error
text). Types: `CoachStats` and friends in `@sistem/types`; client: `getCoachStats(range?)`.
Daily Pump previews go through the existing `toPublicPhoto` (1-hour signed links); without
Cloudinary config the counts still work and the photo list is empty.

## Hidden for missing data / not built

- **Activity feed: weigh-ins, misses, Daily Pump uploads** — the coach only receives
  `trainee_onboarded` and `workout_completed` notifications. The feed shows those, in their
  existing wording, with a pink PR tag from the log's `prCount`. No weight-change or miss tags.
- **Daily Pump card** — hidden while no photo was ever sent. No cross-trainee gallery exists, so
  its arrow opens the newest photo's trainee → Logs.
- **"שבוע 6" on plan cards / the table** — there is no program-week counter; the week's dates and
  the plan's split (when set) are shown instead.
- **Drawer**: questionnaire summary, "טיוטת AI" line, "Daily Pump אחרונים" grid and the "הודעה"
  button (no messaging) — not built. An "overview" tab does not exist on the trainee page; the
  drawer itself is that overview.
- Retention / rating / time-to-plan show "—" until there is data.

## Nav items skipped (no matching route)

התראות (no inbox page — the bell panel stays in the top line) · בונה תוכניות (per trainee; the
"new plan" pill covers it) · תבניות (training templates have no screen) · תפריטים · הגדרות (general).
Kept, under their existing names: ספריית תרגילים, רשימת מזון, תבניות, הגדרות (the three nutrition
pages). "מחכות לתוכנית" is the trainees list with its existing filter.

## New tokens (`packages/tokens/tokens.css`)

Colors: `--color-canvas`, `--color-fill-soft`, `--color-hairline`, `--color-text-faint`,
`--color-icon-quiet`, `--color-dash-outline`, `--color-bar-rest`, `--color-square-missed`,
`--color-lilac`, `--color-lilac-mist`, `--color-peach`, `--color-avatar-{lilac,peach,sky}` +
`-text`, `--color-on-hero-muted`, `--color-tick-rest`, `--color-scrim`.
Gradients / surfaces: `--gradient-canvas`, `--gradient-hero-pink`, `--gradient-hero-lilac`,
`--blur-hero`, `--surface-pill`, `--surface-pill-hover`, `--surface-glass-row`,
`--surface-glass-chip`.
Type: `--text-2xs`, `--text-4xl`, `--text-5xl`, `--text-hero`, `--font-weight-light`,
`--letter-spacing-display`.
Shape: `--radius-panel` (26px), `--radius-drawer`, `--radius-dialog`, `--radius-tile`,
`--radius-row`, `--radius-logo-tile`, `--radius-tooltip`, `--radius-square`, `--radius-bar`.
Shadows: `--shadow-panel`, `--shadow-float`, `--shadow-photo`, `--shadow-side-sheet`,
`--ring-panel`.
Motion: `--ease-drawer`, `--ease-drawer-out`, `--transition-drawer-in`, `--transition-drawer-out`
(pressables reuse the existing `--transition-press` / `--ease-press`).
Layers / layout: `--z-side-sheet`, `--z-drawer`, `--z-palette`, `--breakpoint-dash-nav` (860),
`--breakpoint-dash-grid` (1180), `--sidebar-width`, `--sidebar-width-rail`,
`--sidebar-width-sheet`, `--drawer-width`.

## New i18n keys (he + en; English is placeholder)

- `apps/dashboard/src/copy`: `nav.training`, `nav.overview`, `nav.stats`, `nav.allTrainees`,
  `nav.waiting`; `shell.collapse`, `.expand`, `.menu`, `.search`, `.coach`, `.badge`;
  `palette.placeholder`, `.pickTrainee`*, `.empty`, `.screens`, `.actions`.
  Removed: `nav.exercises` (the sidebar uses the page's own name).
- `features/overview/copy` (new): `greeting.morning`* `.afternoon`* `.evening` `.night`*,
  `weekLine`, `activeTrainees`, `newThisMonth`, `loadError`*, `completion.title` `.caption`
  `.empty`* `.weeks`, `waiting.title` `.window` `.more`*, `pump.title` `.subtitle` `.newSince`,
  `board.title` `.subtitle` `.today` `.done` `.planned` `.missed` `.allTrainees` `.empty`*,
  `activity.title` `.subtitle`, `ending.title` `.subtitle` `.daysLeft` (plural) `.endsToday`*
  `.workouts` `.buildNext`.
- `features/stats/copy` (new): `title`, `subtitle`, `loadError`*, `rangeLabel`,
  `ranges.months3|6|12`, `tiles.*` (9), `active.*`, `weekly.*`, `goals.title` `.subtitle`
  `.empty`*, `retention.*` (`.count`*), `dataPoint`.
- `features/trainees/copy`: `listSubtitle`, `trainee`, `plan`, `daysPerWeek`, `weekProgress`,
  `weekSummary`, `timeLeft`, `buildPlan`, `openWeekPlan`, `fullProfile`*.

\* = not in the reference or the brief — my placeholder wording, marked PLACEHOLDER in the file.
Everything else is the reference's / brief's Hebrew. Reused as they were: trainee statuses,
"צריכה תוכנית לשבוע הבא", the search placeholder, "תוכנית חדשה", the notification texts,
"N שיאים אישיים", the 48h "נותרו / באיחור של", goal names, section names.

## Files

Added (each component = `.tsx` + `.css` in its own folder unless noted)
- `apps/dashboard/src/components/layout/`: AppShell, Sidebar, TopLine, CommandPalette, PagePanel
- `apps/dashboard/src/components/common/`: Avatar, Tag, RoundButton, WidgetCard,
  SegmentedControl, PageHeader, StateLine, Icon (+ `iconPaths.ts`)
- `apps/dashboard/src/hooks/`: `useSidebarCollapse`, `useMediaQuery`, `useSaveLanguage`,
  `useNavigation`, `useCommandPalette`, `usePaletteHotkey`, `useDrawerTransition` (.ts)
- `apps/dashboard/src/services/coach/CoachDataContext.tsx`
- `apps/dashboard/src/features/overview/`: `pages/OverviewPage`, `components/` Greeting,
  HeroStatCard, WeekTicks, WaitingList, PumpCard, WeekBoard, ActivityFeed, EndingPlans;
  `hooks/useRecentActivity.ts`, `data/overviewFormat.ts`, `copy/{he,en,index}.ts`
- `apps/dashboard/src/features/stats/`: `pages/StatsPage`, `components/` StatTile, ChartFrame,
  AreaChart, WeeklyBars, GoalBars, RetentionRow; `hooks/useCoachStats.ts`,
  `hooks/useElementWidth.ts`, `data/chartScales.ts`, `copy/{he,en,index}.ts`
- `apps/dashboard/src/features/trainees/`: `components/TraineeDrawer`, `components/WeekSquares`,
  `hooks/useTraineeDrawer.tsx`, `data/traineeFacts.ts`, `data/traineeTabs.ts`
- `apps/server/src/features/coach/`: `coachStats.ts`, `coachStats.service.ts`,
  `__tests__/coachStats.test.ts`
- `docs/phase-reports/design-coach-dashboard.md`

Modified
- `packages/tokens/tokens.css`, `packages/types/src/index.ts`, `packages/api-client/src/coachApi.ts`
- `apps/server/src/features/coach/coach.controller.ts`, `coach.routes.ts`
- `apps/dashboard/src/app/config/routes.ts`, `app/router/AppRouter.tsx`
- `apps/dashboard/src/copy/he.ts`, `en.ts`; `features/trainees/copy/he.ts`, `en.ts`
- `apps/dashboard/src/services/coach/coachService.ts`
- `apps/dashboard/src/components/common/LanguageToggle/LanguageToggle.tsx` + `.css` (a stacked
  layout for the rail)
- `apps/dashboard/src/features/notifications/components/NotificationBell/NotificationBell.tsx` +
  `.css` (round button, dot, rounded panel — behaviour unchanged)
- `apps/dashboard/src/features/trainees/pages/TraineesPage/TraineesPage.tsx` + `.css` (rewritten)
- `apps/dashboard/src/features/trainees/pages/TraineeDetailPage/TraineeDetailPage.tsx` (tab label
  moved to `data/traineeTabs.ts`)
- `apps/dashboard/src/features/trainees/components/TraineePlans/TraineePlans.tsx` (opens the week
  picker when entered from "new plan")

Deleted (unused after this change)
- `apps/dashboard/src/components/layout/DashboardShell/` (.tsx + .css)
- `apps/dashboard/src/components/common/LanguageSwitch/` (.tsx + .css)

Left in place: `NutritionSubnav` on the three nutrition pages (now a duplicate of the sidebar) and
`TraineeStatusBadges` / `Badge` (the trainee page still uses them).

## Dependencies

None added or removed.

## How to test

```
npm run build        # passes
npm run lint         # passes (i18n audit clean; one known fast-refresh warning per context file)
npm test             # passes: 594 server tests (12 new, coachStats) + 24 copy / client tests
npm run dev:all      # then http://localhost:5174, seed coach: coach@sistem.dev
```

1. **Desktop** — log in → Overview. Check the hero numbers against the trainees list; click a
   waiting row and a board name (drawer); the arrow on a "plans ending" card (next-week draft in
   the builder, or the week picker).
2. **Collapsed sidebar** — the round chevron: icons only, counters on the two trainee icons,
   mark-only logo, stacked toggle. Reload: still collapsed.
3. **⌘K / Ctrl K** — opens at once; type a name; arrows + Enter open her drawer; Esc closes.
   "תוכנית חדשה" (pill or the action) → pick a trainee → her Plans tab with the week picker open.
4. **Drawer** — click a trainees row, or Tab to a row + Enter. Esc / scrim close it and the row
   has focus again. Tab cycles inside. Section pills open the full page on that tab.
5. **Stats ranges** — 3 / 6 / year: the area chart shows 3 / 6 / 12 months and the completion,
   time-to-plan and rating follow. Hover both charts for the tooltip.
6. **390px** (device toolbar) — menu button opens the sidebar sheet (Esc / scrim close), one
   column, no sideways page scroll; the table and the board scroll inside their cards.
7. **he ↔ en** — the toggle mirrors everything: sidebar side, drawer side, chart time direction.
8. **Reduced motion** (DevTools → Rendering) — the drawer and sheet appear without sliding, no
   press scale.
9. **Scoping** — `cd apps/server && npx vitest run src/features/coach`: another coach's trainees
   are never counted; a trainee token gets 403.

Checked here: build, lint, tests; headless Chrome signed in as the seed coach at 1440 × 900 and
390 × 844, Hebrew and English — Overview, Statistics (6 and 3 months), Trainees, the drawer
(keyboard open, focus on close, Esc, focus back on the row), ⌘K (open, arrows, Esc), the rail +
its stored key, the menu sheet, a not-yet-redesigned page inside the shell; no console errors, no
horizontal page scroll at 390px.
**Not checked:** motion watched live (headless only shows end states), reduced motion, chart
tooltips under a real pointer, Safari / Firefox (backdrop blur), a
coach with 20+ trainees, a database with Cloudinary photos that have expired links.
Side effect of the check: the seed coach's saved language was switched to English and back to
Hebrew.

## Known issues / TODOs

1. The six decisions at the top.
2. `GET /coach/stats` reads all of the coach's plans and completed logs on every call (also on
   each page change, for the Overview). Fine for one coach; cache or narrow it before it grows.
3. Historic "active at month end" uses the plans that are published *today*; a plan unpublished
   later changes the past.
4. Pages not redesigned sit in a white panel with their old styling; `NutritionSubnav` now
   duplicates the sidebar.
5. Daily Pump signed links last 1 hour; an Overview left open longer drops the expired previews
   until the next page change reloads them.
6. On a phone the week board scrolls sideways inside its card and starts at the oldest day.
7. CLAUDE.md was not updated with the new shell / endpoint — say if you want it added.
8. Unrelated uncommitted work was left untouched and is not in the commands below:
   `packages/api-client/src/createApiClient.ts`, `vitest.i18n.config.mts`,
   `scripts/api-client.test.ts`, `docs/design/coach-dashboard.html`.

## Suggested commits

1. `feat(tokens): coach dashboard tokens (canvas, panels, hero gradients, drawer motion)`
2. `feat(server): read-only coach stats endpoint`
3. `feat(dashboard): new shell — sidebar, top line, command palette`
4. `feat(dashboard): trainees table and quick-view drawer`
5. `feat(dashboard): overview page`
6. `feat(dashboard): statistics page`
7. `docs: coach dashboard design update report`

```
git add -A -- packages/tokens/tokens.css
git commit -m "feat(tokens): coach dashboard tokens (canvas, panels, hero gradients, drawer motion)"

git add -A -- packages/types/src/index.ts packages/api-client/src/coachApi.ts apps/server/src/features/coach apps/dashboard/src/services/coach/coachService.ts
git commit -m "feat(server): read-only coach stats endpoint"

git add -A -- apps/dashboard/src/components apps/dashboard/src/hooks apps/dashboard/src/app apps/dashboard/src/copy apps/dashboard/src/services/coach/CoachDataContext.tsx apps/dashboard/src/features/notifications apps/dashboard/src/features/trainees/hooks
git commit -m "feat(dashboard): new shell — sidebar, top line, command palette"

git add -A -- apps/dashboard/src/features/trainees
git commit -m "feat(dashboard): trainees table and quick-view drawer"

git add -A -- apps/dashboard/src/features/overview
git commit -m "feat(dashboard): overview page"

git add -A -- apps/dashboard/src/features/stats
git commit -m "feat(dashboard): statistics page"

git add -A -- docs/phase-reports/design-coach-dashboard.md
git commit -m "docs: coach dashboard design update report"
```

The app builds only from commit 6 on (the shell imports the drawer, the Overview and the
Statistics page) — commits 3–6 belong together; squash them if every commit must build.
