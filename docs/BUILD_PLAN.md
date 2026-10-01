# Sistem — Claude Code Build Plan

How to use this file:
- Run **one phase per Claude Code session** (or per `/clear`). Paste the phase prompt as-is.
- Review the phase report, test, commit yourself, then move on.

## Global rules (Claude Code follows these in every phase — also written into CLAUDE.md in Phase 0)

1. **Never run git commands that change history or the remote**: no `git add`, `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git stash`, no branch creation. Read-only git (`git status`, `git diff`, `git log`) is fine.
2. **At the end of every phase, write a report** to `docs/phase-reports/phase-XX-<short-name>.txt` (e.g. `phase-01-strip-website.txt`) containing:
   - **Summary** — what was done, in 3–6 lines
   - **Files changed** — added / modified / deleted
   - **Dependencies** — added / removed
   - **How to test** — exact commands and manual checks
   - **Known issues / TODOs** — anything left open or needing a decision
   - **Suggested commits** — one or more commits in Conventional Commits format (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`), each with the list of files it should include, so the owner can commit them in logical chunks
   - The report **ends with the suggested commits as ready-to-paste git commands** (`git add -A -- <paths>` + `git commit -m "..."`, in order, one block per commit). Claude Code never runs them. CLAUDE.md is never included.
3. After writing the report, stop and print the report path and the suggested commits (as the ready-to-paste git commands) in chat.
4. `docs/PRD.md` is the source of truth. If something conflicts with it, ask before deviating.
5. **Mobile-first always** (mobile app only; the coach dashboard is desktop-first): design for 360–430px wide screens first, touch targets at least 44×44px, no hover-only interactions, no scroll-driven website effects. Every new screen must look right on a small phone (iPhone SE size) and a large one (Pro Max size).

- `docs/PRD.md` is the source of truth. If a phase conflicts with the PRD, the PRD wins — ask before deviating.
- Design is owned by the product owner: Claude Code builds functional, clean screens using the design tokens only, without inventing a visual style.

## Owner decisions (from the Phase 0 review, 2026-09-29)

These apply to every later phase. Details and reasoning: `docs/phase-reports/phase-00-audit.txt`.

- **Onboarding is fully protected.** Everything in the onboarding flow is KEEP. Anything onboarding imports (AppShell/Sidebar, Container, Section, GlassCard, common components, usersService) must be kept or replaced, never broken. Onboarding's own activity list (`features/onboarding/data/activities.ts`, server `users.constants.ts`) stays untouched. Keep `docs/Onboarding.txt`.
- **The separate activity logger is removed**: client `features/activities` + `services/activities`, server `features/activities` + `/api/activities`. It is not part of onboarding. `DashboardCalendar` and `AchievementBadges` stay (ADAPT), decoupled from it; they are reworked in Phase 7 and Phase 11.
- **Kaggle exercise dataset is NOT cleared for commercial use** (license unconfirmed). Keep only plain factual fields: exercise name, body part, equipment, level (and the one-word type needed for `movementType`). No copied text: no descriptions, tips, instructions or ratings. Until original descriptions exist (Backlog), **the coach's per-exercise notes in the plan are the instructions trainees see**.
- **Logo**: the ATLAS logo is replaced by a single `Logo` component rendering a "SISTEM" text placeholder, so the real logo can be swapped in one place. ATLAS logo files are deleted.
- **Onboarding copy**: only the word "ATLAS" is replaced with "Sistem"; all other wording stays until the owner sends new text.
- **DashboardPage stays** as the post-onboarding screen until the waiting screen exists (Phase 4).
- **CLAUDE.md stays gitignored.** Never commit it and never remove it from `.gitignore`. Never include it in suggested commits.
- **Onboarding data** moves to a separate `OnboardingResponse` collection (PRD §10). The migration from `User.profile` happens in Phase 3, not before.
- **Onboarding answers are saved to the server after every step** (resume on any device).
- **Onboarding videos** stay local and gitignored until Phase 2c, where they are compressed and hosted on **Cloudinary**. Never bundle them into the app and never commit them.
- **Cloudinary** is the storage for onboarding media, Daily Pump photos and progress photos (Phases 2c, 9, 10). Private photos use authenticated/signed delivery only.
- **AI chat is deleted** (client CoachWidget + server aiCoach). **Knowledge (RAG) is kept** for the Phase 12 coach recommendation.
- **All RepDB content is removed** (CC BY-NC): data, import, route and attribution. The Exercise schema fields (`contentTier`, `media.gallery`, etc.) are kept for now. Exercises have no media for the MVP.
- **No exercise library screen for trainees.** Exercise components are kept; the library UI moves into the dashboard plan builder.
- **One coach for now.** New trainees get the coach's id automatically on sign-up (from config/seed). The model must allow multiple coaches later.
- **Weeks start on Sunday.** Default time zone `Asia/Jerusalem`; store a `timezone` per user.
- **Fresh database.** No migration of ATLAS users.
- **Password reset is not in the MVP** (see Backlog).
- **Monorepo approved.** Phase 1 removals happen in the current structure; the move to apps/ + packages/ happens in Phase 2.

---

## Phase 0 — Audit & project memory (no code changes)

```
Read docs/PRD.md fully. This repo is a copy of ATLAS that we are turning into Sistem, a mobile coaching app.

Do NOT change any code in this phase. Instead:
1. Map the current codebase: client structure, routes/pages, components, server routes, models, auth flow, onboarding flow, exercise library and its import pipeline.
2. Produce a table with three columns: KEEP / ADAPT / REMOVE for every major module, with one line of reasoning each, based on the PRD (§11 lists what to keep and remove).
3. List gaps: everything in the PRD MVP that does not exist yet.
4. Flag risks (e.g. anything in auth or onboarding that will break when the homepage is removed).
5. Propose a repo structure for three parts sharing one backend: the mobile app (React + Vite + Capacitor, with trainee mode and coach mode by role), the coach web dashboard (React), and the server — including how they share TypeScript types, API client and design tokens (e.g. a monorepo with apps/ and packages/). Proposal only, no moves yet.
6. Create a CLAUDE.md at the repo root with: project summary, stack, folder structure, commands (dev/build/test/lint), coding conventions you observed, "Always read docs/PRD.md before starting a task", and the Global rules from docs/BUILD_PLAN.md (no git writes, phase report + suggested commits after every phase).
7. Write the phase report per the Global rules (docs/phase-reports/phase-00-audit.txt).

Stop and show me the KEEP/ADAPT/REMOVE table and the structure proposal before anything else.
```

---

## Phase 1 — Strip the website

```
Using the KEEP/ADAPT/REMOVE table from the audit, remove everything website-only: marketing homepage, hero/scroll video, landing sections, website navigation/footer, SEO-only pages, and their unused assets, styles and dependencies.

Rules:
- Do not touch auth, onboarding, the exercise library, or server models/routes that are marked KEEP.
- Onboarding must keep working end to end. Before deleting anything, re-check the onboarding dependency list in the Phase 0 report (§5) and handle each item:
  - Adapt PageLayout into a minimal layout without Navbar/Footer BEFORE deleting Navbar/Footer (Register and ProtectedRoute use it).
  - Keep DashboardPage and the /dashboard route — it stays the post-onboarding screen until Phase 4.
  - Sidebar: remove links to deleted routes (/exercises); "/" redirects to login.
- Do not touch the onboarding videos (client/src/assets/onBoardingvid) — they stay local and gitignored until Phase 2c. Do not touch onboarding's own activity list (features/onboarding/data/activities.ts, server users.constants.ts).
- Logo: create one `Logo` component (own folder + CSS) that renders a "SISTEM" text placeholder, use it everywhere the ATLAS logo was used (AuthCard, Sidebar), and delete client/src/assets/Logo/ATLASlogo3.png (and the folder).
- Onboarding copy: replace only the word "ATLAS" with "Sistem" (WelcomeStep, FrequencyStep, ExercisePreferencesStep, RecoveryStep, ReviewStep). Change no other wording.
- Remove the AI chat: client features/coach + services/coach + <CoachWidget/>, server features/aiCoach + /api/coach, and the now-unused @google/genai dependency. Keep features/knowledge.
- Remove the separate activity logger: client features/activities + services/activities, server features/activities + /api/activities. Decouple DashboardCalendar (drop activity fetching, the "Log Activity" modal and activity entries; keep the workout calendar) and AchievementBadges (drop activity-based badges) so they still build. They are reworked in Phases 7 and 11.
- Remove all RepDB content: importRepDbPreview script + `import:repdb` npm script, REPDB_* mappings and RepDB types, repdbNormalize test, the /media/repdb static route, the RepDB attribution (server exercise.service + client ExerciseDetailPage), and server/data/repdb-preview. Keep the Exercise schema fields (contentTier, media.gallery, etc.). Make sure exercise search sorting still works without 'enhanced' records (tests).
- Kaggle import — facts only: the importer keeps only name (Title), body part (BodyPart), equipment (Equipment), level (Level) and the one-word type (Type → movementType, required by the schema). Stop mapping Desc into instructions.execution, stop storing the full CSV row in source.raw (keep only the factual fields), never import Rating/RatingDesc. Update the normalize/dedup tests accordingly. Set source.license to a value that states "unconfirmed — facts only". If a dev database already holds imported descriptions, document how to re-import (fresh DB per owner decision).
- Rewrite docs/THIRD_PARTY_CONTENT.md: RepDB removed; Kaggle dataset kept for factual fields only, with the decision and the reason (license could not be confirmed, provenance unknown → treated as not cleared for commercial use; descriptions, tips, instructions and ratings dropped).
- Remove the trainee exercise library routes (/exercises, /exercises/:slug) but keep the exercise components and services.
- Fix the 2 existing client TypeScript errors listed in the Phase 0 report.
- Remove dead imports and unused packages. The app must build and run with zero errors after this phase.
- The root route "/" should temporarily redirect to the login screen.
- Rename project/app name references from ATLAS to Sistem (package.json, titles, manifest, env examples) — but not in git history or migrations.

Finish with: list of deleted files, removed dependencies, and confirmation that `build` and `lint` pass.
```

---

## Phase 2 — App shell, design tokens, routing guards

```
Turn the client into a mobile-first app shell per docs/PRD.md §4.2, §5 and §12.

1. Design tokens: create a single tokens file (CSS variables) with the palette in PRD §12, plus a dark text token (#111111), spacing, radius (mostly 0 — we use sharp cuts), and typography scale. No hard-coded colors anywhere else.
2. Layout: mobile-first app container, safe-area handling, bottom tab bar with Home / Workouts / Profile (placeholder pages for now).
3. Routing guard implementing the state table in PRD §4.2 (unauthenticated → auth; onboarding incomplete → onboarding; onboarding done & no published plan → waiting screen; has plan → home). The state must come from the server, not local assumptions.
4. Role-based app shell: role=trainee gets the trainee tabs (Home / Workouts / Profile); role=coach gets coach tabs (Inbox / Trainees / Profile) — placeholder pages for now. Guards enforced on the server as well.
5. If the Phase 0 structure proposal was approved, apply it now (move the client into its place and scaffold an empty coach dashboard app that builds and shows a login page using the shared auth).

Keep styling minimal and functional — the owner will design. Do not add a UI library without asking.
```

---

## Phase 2b — Adapt kept ATLAS screens to app scale

```
The screens we kept from ATLAS (login, sign-up, onboarding questionnaire, and any shared components like buttons, inputs, cards) were built for a desktop website. Adapt them to the mobile app scale. Read the Global rules (mobile-first) and PRD §12 first.

1. Audit first: list every kept screen and shared component with what's not app-ready (fixed widths, desktop font sizes, hover-only effects, small tap targets, scroll/GSAP website effects, multi-column layouts, modals that don't fit a phone). Show me the list before changing anything.
2. Then adapt:
   - Viewport meta for Capacitor (width=device-width, viewport-fit=cover), safe-area insets, no horizontal scroll, no page zoom on input focus (inputs at least 16px font).
   - Mobile type scale and spacing from the tokens file — replace any hard-coded sizes and colors with tokens.
   - Touch targets ≥ 44px, press states instead of hover states.
   - Onboarding: one question per screen, progress indicator, sticky bottom "Next" button that stays above the keyboard, back navigation.
   - Forms: correct input types / inputMode (email, numeric), autofill hints, keyboard doesn't cover the active field.
   - Remove scroll-driven or heavy website animations; keep only light transitions.
3. Do not invent a new visual style — only change scale, layout and behavior, using existing tokens. The owner handles the visual design.
4. Verify on iPhone SE (375×667) and iPhone Pro Max (430×932) viewports and note any issue in the report.
```

---

## Phase 2c — Onboarding media to Cloudinary

```
Move the onboarding videos out of the app bundle and onto Cloudinary. The videos must never be bundled into the app or committed to git. Read the Phase 0 report (onboarding videos) first.

a) Compression script: compress every onboarding video with ffmpeg for mobile — 720p max, H.264 MP4, no audio track, a reasonable CRF, `-movflags +faststart` — and generate one poster image per video. Print a before/after size report per file and in total. Output goes to a gitignored folder; originals are never modified.
b) Upload script: upload the compressed videos and posters to Cloudinary into a `sistem/onboarding` folder and write a manifest (JSON) mapping each activity/video key to its video URL and poster URL. Re-running must be safe (overwrite / skip unchanged).
c) Onboarding reads video URLs from that manifest/config instead of local imports. Lazy-load each video, show the poster until the video can play, and fall back gracefully (poster only) if the video fails or the network is slow. No video file is imported into the client bundle anymore.
d) Cloudinary credentials only in .env (never in code or the manifest). Add the keys (e.g. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) to .env.example.

ffmpeg and the Cloudinary SDK are new tools/dependencies: confirm with me before installing. Document how to run both scripts in the phase report.
```

---

## Phase 3 — Data model & roles

```
Implement the data model in docs/PRD.md §10 on the server.

1. Add `role` (trainee|coach), `onboardingStatus`, `onboardingCompletedAt`, `coachId`, `pushTokens`, `timezone` (default 'Asia/Jerusalem') to the User model. Fresh database — no backfill of ATLAS users is needed.
   One coach for now: on sign-up a trainee gets the coach's id automatically (from config/seed). Keep `coachId` per trainee so multiple coaches are possible later — never assume a single coach in queries.
2. Create models: Plan (with embedded workouts), WorkoutLog, BodyMetric, Achievement, Template, and a separate OnboardingResponse collection (PRD §10). Reuse the existing Exercise schema and the existing onboarding answer shape.
   Migrate onboarding storage from User.profile to OnboardingResponse (server + client service), including per-step partial saves used by Phase 4. Plan weeks start on Sunday and are computed in the user's timezone.
3. Middleware: requireAuth (existing JWT), requireRole('coach'). Every trainee-data endpoint must verify ownership server-side.
4. A seed script that creates one coach account and 2 test trainees with onboarding data.
5. Tests for the authorization rules: a trainee cannot read another trainee's data; a trainee cannot hit coach endpoints.

Show me the schemas before writing the routes.
```

---

## Phase 4 — First-launch onboarding & 48h waiting screen

```
Implement PRD §4.1 steps 1–3.

1. After sign-up, route directly into the existing onboarding questionnaire (reuse the ATLAS onboarding logic and questions). Answers are saved to the server after every step, so onboarding resumes where it left off — even on another device.
2. On completion, the server sets onboardingCompletedAt and onboardingStatus=complete.
3. Build the "Your plan is being built" screen: a 48h countdown computed from the server timestamp, the message from the PRD, and placeholder slots for 3D gym/sport icons (I will provide the assets — create an obvious, easy-to-swap icon slot component).
4. Poll or subscribe so that when a plan is published, the user is moved to Home automatically.
5. Fire an internal "trainee.onboarded" event on the server (Phase 5a will hook notifications into it).
```

---

## Phase 5 — Notifications (split into 5a and 5b — owner decision, 2026-10-01)

Phase 5 is split because native push needs Apple / Google developer accounts and a Firebase
project, which are not available yet. In-app notifications come first; push is added later on
top of the same `notify()` service, so nothing built in 5a is thrown away.

### Phase 5a — In-app notifications (now)

```
Read PRD §9. In-app notifications only — no push, no Capacitor, no new dependencies.

1. A Notification collection: every notification is stored per recipient, with read/unread.
2. Server notification service with a single `notify(userId, payload)` function that stores the notification. Phase 5b adds push delivery inside this same function — callers never change.
3. Hook it up: "trainee.onboarded" → notification to the coach (points to that trainee); "plan.published" → notification to the trainee (points to Home).
4. API: list my notifications, mark one / all as read. A user can only ever read or change her own notifications.
5. Tests for the hooks and the authorization rules.

Show me the Notification schema and the payload types before writing the routes.
```

### Phase 5b — Mobile packaging & native push (later, before launch)

Needs Apple + Google developer accounts and a Firebase project — not available yet.

```
Read PRD §9 and §11 (App packaging).

1. Set up Capacitor for the mobile app (iOS + Android). Decision already made — do not propose alternatives. Includes the app icons (logo files in packages/tokens/brand/).
2. Register device push tokens after login and store them on the user (User.pushTokens). Handle denied permission gracefully. The coach uses the same mobile app (coach mode), so her push goes through the same native flow.
3. Add push delivery via FCM inside the existing `notify(userId, payload)` service from Phase 5a: every notification is still stored, and is also pushed to the user's devices. Handle invalid/expired tokens.
4. Tapping a push follows the notification's target: "trainee.onboarded" opens that trainee in the app's coach mode; "plan.published" opens Home. If the plan is published before the 48h timer ends, the waiting screen must switch to Home immediately when the app is open (listen for the event / poll) and on next launch otherwise.
5. Document the required env vars and platform setup steps in docs/SETUP.md.
```

---

## Phase 6 — Coach admin

```
Implement PRD §6 (MVP parts only: trainees list, trainee detail, plan builder, publish) in the **coach web dashboard** (React, desktop-first, responsive). Use the shared API client, types and design tokens.

1. Trainees list with status filter (new / waiting for plan / active / inactive) and remaining time on the 48h window.
2. Trainee detail: onboarding answers, plans, workout logs (with summaries & pump photos), body metrics.
3. Plan builder: create a weekly plan → add workouts → add exercises from the exercise library (search) → set sets, reps, target weight, rest, notes. Reorder exercises. Save draft / publish. Duplicate previous week.
4. Publishing triggers "plan.published" (the event and its notification listener exist since Phase 5a — the publish service only has to emit it).
5. Dashboard routes require role=coach, enforced on the server as well as the client.
```

---

## Phase 6b — Coach mode in the mobile app

```
Implement the coach mode described in PRD §6 inside the mobile app. Reuse the API and, where sensible, components from the dashboard via the shared packages.

- Inbox: notifications list (new trainee, workout completed), read/unread, tap → relevant trainee. Uses the Phase 5a in-app notifications API (no push needed).
- Trainees: list with status filter and 48h time remaining.
- Trainee detail: onboarding answers, current plan (read-only), workout logs with summaries and Daily Pump photos, body metrics.
- Light actions only: publish an existing draft plan; duplicate last week's plan and publish. Full plan editing stays on the web dashboard — show an "Edit on dashboard" hint.
```

---

## Phase 7 — Trainee Home & Workouts

```
Implement PRD §5.1 and §5.4.

- Weeks start on Sunday; "this week" and "missed" are computed in the trainee's stored timezone.
- Home: this week's workouts in order with status (upcoming/done/missed), a primary "Start next workout" action, a recent-achievements strip (empty state for now), current streak placeholder.
- Workouts: current week, past weeks, completed logs; tapping a log opens its details (read-only).
- All data from the API; proper loading, empty and error states.
```

---

## Phase 8 — Active workout session

```
Implement PRD §5.2.

- Exercise list with the exercise name and factual info from the library (body part, equipment, level), target sets × reps × weight, rest, and the coach's per-exercise notes as the instructions. No library descriptions or media for the MVP (owner decision — see Backlog); leave an empty, easy-to-fill slot for them.
- Per-set logging (actual reps & weight, complete toggle), prefilled with targets.
- Optional rest timer between sets.
- Persist in-progress state locally and sync to the server so a session survives app close / offline, then resumes.
- "Finish workout" creates/finalizes the WorkoutLog and navigates to the summary.
- "Workout completed" notification (owner decision, Phase 6b): when a trainee finishes a workout, notify her coach — a new notification type through the existing event → listener → `notify()` path (Phase 5a), pointing to that trainee. Show it in both Inboxes (the dashboard bell and the mobile coach Inbox): the wording and tap target go in `describeCoachNotification` in `@sistem/shared`, which both already use.
```

---

## Phase 9 — Workout summary & Daily Pump

```
Implement PRD §5.3.

- Computed stats: duration, total volume, sets completed, PRs hit (compare to previous logs).
- Rating + free-text notes.
- Daily Pump photo: camera or gallery, compressed client-side, uploaded to Cloudinary (decided) as private/authenticated assets, served only through signed URLs. Credentials from .env only.
- Save to WorkoutLog; visible to the coach in trainee detail.
- Leave a slot for "achievements unlocked" (filled in Phase 11).
```

---

## Phase 10 — Profile & body tracking

```
Implement PRD §5.5.

- Profile details and editable onboarding answers where sensible.
- Body weight log + chart over time.
- Measurements (chest, waist, hips, arms, thighs — configurable list) over time.
- Progress photos gallery (dated, front/side/back), same private storage as Phase 9.
- Settings: notification preferences, log out.
```

---

## Phase 11 — Achievements & streaks

```
Implement PRD §7.

- Data-driven achievement definitions (config file, not hard-coded if/else chains).
- Server-side evaluation after each WorkoutLog and BodyMetric save; idempotent (never award twice).
- Streak calculation (weekly plan completion streak).
- Show unlocked achievements in the Workout Summary and on Home.
- Unit tests for each achievement rule.
```

---

## Phase 12 (later) — AI plan recommendation

```
Implement PRD §8.

- When "trainee.onboarded" fires, run a background job that sends the onboarding answers + retrieved candidate exercises from the exercise library (reuse the existing RAG integration in features/knowledge) to the LLM.
- Note: the ATLAS LLM client (Gemini, @google/genai) lived in the deleted aiCoach feature. Ask me which LLM provider to use before adding one back.
- Require structured JSON output matching our Plan schema, validate it, and reject any exercise IDs not in the library.
- Store as an AIRecommendation (draft). In the coach plan builder, add "Load AI recommendation", which pre-fills an editable draft with the rationale shown alongside.
- The recommendation is never sent to the trainee directly.
```

---

## Phase 13 (later) — Nutrition

```
Implement PRD §5.6: coach nutrition builder (meals, foods, portions, notes) per trainee, and a Nutrition tab for the trainee to view their plan. Propose the schema first.
```

---

## Backlog (not scheduled)

- **Password reset** — not in the MVP. The ATLAS forgot/reset-password flow (server routes + Resend email + client pages) exists; before enabling it in the app it needs a deep link / universal link or a small web reset page, and a Sistem email sender.
- **Write original exercise descriptions** — AI draft reviewed and approved by the coach. Until then, the coach's per-exercise notes in the plan builder are the instructions trainees see.
- **Multiple coaches** — the model supports it (coachId per trainee); UI, assignment and coach sign-up are not planned yet.