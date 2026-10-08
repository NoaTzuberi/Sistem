# Sistem — Product Requirements Document

> Status: Draft v0.1 · Source codebase: fork of ATLAS (React + Vite + TypeScript, Node.js + Express, MongoDB)

## 1. Overview

Sistem is a mobile coaching app that connects a personal coach with her trainees. A trainee signs up, completes an onboarding questionnaire, and within 48 hours receives a personalized weekly training plan built by the coach. The trainee then follows workouts in the app, logs sets/reps/weights, submits a post-workout summary with a "Daily Pump" photo, tracks body progress, and earns achievements.

Sistem is an **app, not a website**. There is no marketing homepage. The app opens directly into authentication.

### 1.1 Terminology

To avoid confusion in code and docs, use these names consistently:

| Term | Meaning |
|---|---|
| **Coach** | The trainer who owns the business. Admin role. (The product owner's client.) |
| **Trainee** | An end user who trains with the coach. |
| **Plan** | A weekly training program assigned by the coach to one trainee. |
| **Workout** | A single training session inside a plan (e.g. "Monday — Lower Body"). |
| **Exercise** | An entry from the exercise library (reused from ATLAS). |
| **Workout Log** | A trainee's actual performance of a workout: sets, reps, weights, summary, photo. |

## 2. Goals

1. Get a new trainee from install to "plan requested" in a single, frictionless flow.
2. Give the coach one place to see every trainee's data and build personalized weekly plans.
3. Make training in the app feel rewarding: clear instructions, fast logging, visible progress, achievements.
4. Lay foundations for AI-assisted plan recommendations and nutrition plans (later phases).

## 3. Roles & Access

| Role | Can do |
|---|---|
| Trainee | Sign up / log in, complete onboarding, view own plans & workouts, log workouts, upload photos, track body metrics, view achievements. |
| Coach | Uses the web dashboard (full) and coach mode in the mobile app (on the go) to: view all trainees and their onboarding data, receive new-trainee notifications, build workouts and weekly plans, assign/publish plans per trainee, view trainee logs, photos and body metrics. |

- Authentication: **JWT, reused from ATLAS** as-is. Add a `role` field (`trainee` | `coach`) to the user model.
- Coach accounts are never created via public sign-up. They are seeded or promoted manually.
- All API routes enforce role-based authorization server-side. A trainee can only ever read/write their own data.

## 4. Core User Flows

### 4.1 First launch (Trainee)

1. App opens → **Sign Up / Log In** screen (no homepage).
2. After sign-up, the trainee is routed directly into the **Onboarding Questionnaire** (same questions and logic as ATLAS onboarding).
3. On completion → **"Your Plan Is Being Built" screen**:
   - Playful, polished design with 3D-style gym & sports icons.
   - A **48-hour countdown** timer computed from `onboardingCompletedAt` on the server (not device time).
   - Message: the trainee's personalized workouts will be ready within 48 hours.
   - If the coach publishes the plan before the timer ends, the trainee receives a push notification ("Your plan is ready") and the app moves straight to Home — immediately if the app is open, or on the next open / notification tap.
4. At the same moment, the **coach receives a push notification** on her phone: "New trainee: {name}", deep-linking to that trainee's profile with full onboarding answers.

### 4.2 Routing rules (Trainee)

| State | Lands on |
|---|---|
| Not authenticated | Sign Up / Log In |
| Authenticated, onboarding incomplete | Onboarding (resumes where left off) |
| Onboarding complete, no published plan | 48h Waiting screen |
| Has a published plan | Home |

### 4.3 Coach flow

1. Receives push notification for a new trainee.
2. Opens trainee profile → reviews onboarding answers.
3. Builds a weekly plan: workouts → exercises (from the exercise library) with sets, reps, target weight, rest, notes.
4. Publishes the plan → trainee gets a push notification "Your plan is ready" and the app moves to Home.
5. Updates / creates the next week's plan on an ongoing basis. Plans can be duplicated from a previous week or from a template.

## 5. Trainee App — Screens

Bottom tab navigation: **Home · Workouts · Profile** (Nutrition added later).

### 5.1 Home
- **This week's upcoming workouts**, in order, with status (upcoming / done / missed).
- A clear "Start next workout" call to action.
- **Recent achievements** strip (see §7).
- Current streak.

### 5.2 Workout (active session)
- List of exercises in the workout. For each exercise:
  - Name and media (image/GIF/video) if available from the exercise library.
  - Target **sets × reps × weight** and rest time.
  - The **coach's notes** for this exercise — these are the instructions the trainee sees. (Library descriptions are not shown for now; original exercise descriptions are a backlog item — see §14.)
  - Per-set logging: actual reps and weight, mark set complete.
  - Optional rest timer between sets.
- Progress through the workout is saved continuously so the session survives app close.
- "Finish workout" → Workout Summary.

### 5.3 Workout Summary
- Auto-generated stats: duration, total volume, sets completed, personal records hit.
- "How was it?" — rating (e.g. 1–5 or emoji scale) + free-text notes.
- **"Daily Pump" photo upload** (camera or gallery).
- Any achievements unlocked by this workout are revealed here.
- Saved as a Workout Log, visible to the coach.

### 5.4 Workouts
- All of the trainee's workouts: current week, past weeks (history), and completed logs.
- Tap a past log to see what was performed, the summary, and the Daily Pump photo.

### 5.5 Profile
- Personal details and onboarding answers (editable where it makes sense).
- **Body weight tracking**: log entries over time + chart.
- **Body measurements** (circumferences): e.g. chest, waist, hips, arms, thighs — logged over time.
- **Progress photos**: dated gallery (front / side / back).
- Settings, notifications, log out.

### 5.6 Nutrition (later phase — Phase 13a / 13b / 13c)

Source: the coach's guide `docs/reference/nutrition-guide-1500.pdf` ("1,500 kcal menu — modular portions guide") and the review list `docs/reference/nutrition-guide-issues.md`. `docs/reference/` is the coach's own content: local only, gitignored.

**Method — exchange lists ("portions").** Food is grouped, and every group has a calorie cap per portion:

| Group | Cap per portion | Notes |
|---|---|---|
| Protein | ≤ 150 kcal | e.g. 150 g cottage 5%, 2 L eggs, 130 g chicken breast |
| Carb | ≤ 120 kcal | e.g. 30 g dry oats, 3 slices light bread, 1 medium banana |
| Fat | ≤ 90 kcal | e.g. 2 tsp olive oil, ¼ large avocado, 10 almonds |
| Vegetable | free | not counted |

A meal is defined as **a number of portions per group** (halves allowed, e.g. 1.5 protein). Any portion can be swapped for any other item **from the same group** (the guide's "iron rule for variety"). Meal calories are computed from the portions × the group value (the guide's own table: 1 protein + 1 carb + 1 fat ≈ 360 kcal), never from individual foods.

**Food list (coach).** Food items: group (protein / carb / fat / vegetable), name, portion description (e.g. "3 slices", "1 heaping tsp"), grams (optional — eggs, slices and spoons have none), kcal per portion (optional; the guide gives only the group caps, so it is empty unless the coach fills it, and it may never exceed the group cap), an optional "new" tag, and diet tags (what it contains — e.g. meat, poultry, fish, dairy, eggs, gluten, peanuts, tree nuts, sesame, soy — so the list can be filtered by her nutrition preferences). Seeded from the guide (20 protein, 12 carb, 12 fat items, names as written by the coach; the food list's values are the source of truth, the guide's gaps are listed for the coach in the issues file); the coach edits and adds, and reviews the seeded tags. No vegetable items are invented. Items used by a plan are archived, never deleted.

**Nutrition preferences (new onboarding step, Phase 13a).** A "Nutrition preferences" step (placeholder copy until the owner sends wording): diet type (none / vegetarian / vegan / pescatarian), kosher (yes / no), allergies and intolerances (a common list + free text), foods she dislikes (free text). Stored in OnboardingResponse with the other answers. Allergies are health data and get the same privacy as the rest of onboarding (her own and her coach's eyes only). The coach sees them in the trainee profile and in the nutrition builder (with a warning when an option uses an item that conflicts with them).

**Nutrition plan (coach, dashboard).** One current plan per trainee (not weekly), built in the dashboard:
- **Calorie target**: the server suggests an estimate — BMR (Mifflin-St Jeor, from her latest weight, height, age from birth date, and sex) × an activity factor from her training frequency, then a goal adjustment (deficit / surplus %). The coach approves the suggestion or overrides it. The inputs used are shown next to the number.
  - Goal mapping (onboarding goals, which stay unchanged): "lose weight" → fat-loss deficit; "build muscle" without "lose weight" → small surplus (muscle gain); anything else → small deficit (toning / recomp). Maintenance (0%) is available to the coach.
  - All percentages (fat-loss deficit, toning / recomp small deficit, muscle-gain small surplus, maintenance 0), the activity factors and the floor live in **one config the coach can tune**.
  - Sex "other" or missing: **no automatic estimate** — the coach picks the formula (male / female constants) or types the target.
- **Safety floor**: a target below **1,200 kcal** needs an explicit coach confirmation (stored with the plan).
- **Meals**: an editable list (default: breakfast, lunch, snack, dinner), each with portions per group (steps of 0.5), vegetables free, kcal per meal computed; the day total is shown against the target.
- **Meal options**: each meal has options (the guide's "Option A / Option B", "Classic combo / Salty combo") — lines that point to food-list items with a portion count, or free text (e.g. "cut vegetables — free").
- **Coach tips**: free notes on the plan (e.g. the guide's protein tip and swap rule).
- **Templates**: e.g. "1,500 kcal" — the coach starts a trainee's plan from a template and adjusts it. One template is seeded from the guide.
- Draft → publish. Editing a published plan and publishing again creates a new version; the trainee always sees the latest published version.

**Trainee — Nutrition tab.** Her meals for the day, each with its portions per group (e.g. "1 protein · 1 carb · 1 fat · vegetables free"), the coach's options and tips. Tapping a portion opens **all swaps from that group** (name, portion description, grams, "new" tag). Portions are the focus: calorie numbers are not on the trainee screens.

**Coach mode (mobile).** Read-only view of a trainee's nutrition plan (Trainee detail → Nutrition). Building and editing happen on the web dashboard.

**Notifications.** The trainee is notified when a nutrition plan is published and when a published plan is updated (tap → Nutrition tab).

**Planned, closed behind feature flags (13b).** Data model designed in 13a, UI hidden:
- Recipes and menu suggestions built by the coach (ingredients mapped to food items and portions).
- Meal logging: the trainee marks the portions eaten per meal.
- Water tracking: daily goal and quick-add.

**AI nutrition draft (13c — uses the Phase 12 AI infrastructure).** Same rule as §8: nothing AI-generated reaches the trainee without the coach publishing it.
- Runs when onboarding completes and on demand from the coach.
- The calorie target is computed **in code, never by the model** (the same calculation as the suggestion above; percentages in one coach-tunable config; same 1,200 kcal floor).
- The model only chooses the meal structure (portions per group per meal) and the meal options, using **only** the coach's food list (sent as ids), plus a short rationale for the coach.
- Her nutrition preferences are respected **in code first**: the food list is filtered (diet type, allergies, kosher) before it is sent to the model; kosher also means no meat and dairy in the same option (checked on the output). Dislikes are free text: sent to the model and shown to the coach, who reviews.
- Code validates the output (food ids exist, are allowed for her and match their group, every meal complete, portion totals match the target within a tolerance); invalid output is retried, then rejected.
- The coach sees it as an editable draft in the nutrition plan builder, with the rationale.

**Decisions (owner, 2026-10-07).** Goal mapping, sex "other" / missing, and the nutrition preferences step: as above. The guide's gaps (dinner 435 vs ~420 kcal, lunch turkey / patties amounts, cheese slices, no vegetable items) are seeded with the food list's values and listed in `docs/reference/nutrition-guide-issues.md` for the coach. Food names and all coach content are stored and shown as written (Hebrew) — no auto-translation; the app becomes Hebrew-first in Phase 15 (§11).

**Decisions (owner, 2026-10-08 — Phase 13a).**
- The guide's data for the seed lives in `apps/server/data/nutrition/` (gitignored, generated once from the guide) and is loaded by `npm run seed:nutrition`; committed code holds no coach content, tests use a fake fixture.
- Default numbers (starting points, all coach-tunable): fat loss −20%, toning / recomp −10%, muscle gain +10%, maintenance 0; activity factor by training days (the rounded middle of her min–max answer): 1–2 → 1.375, 3–4 → 1.55, 5–6 → 1.725, 7 → 1.9; floor 1,200.
- "A / B" alternatives in one guide line: the first is seeded as the line, the second is reached through the swap list.
- `vegetablesFree` per meal: seeded true on breakfast, lunch and dinner, false on the snack; the coach can change it.
- Allergy list: the 8 allergens that have a diet tag (dairy / lactose, eggs, gluten, peanuts, tree nuts, sesame, soy, fish); everything else is free text.
- No trainee inbox. Instead an **"unseen update" dot** on the trainee's tab bar: Nutrition when a new nutrition version was published since she last opened the tab, Workouts when a training plan was published or a published one changed. "Last seen" is stored on the server (works across devices). The stored notifications stay for Phase 5b push.
- The proposed diet tags of the seeded items are a starting point for the coach to review.

## 6. Coach Admin — Screens

**Decision:** the coach has **both**:
- **Web dashboard** (desktop-first, responsive) — the main workspace for heavy work: plan building, templates, and later AI recommendations and nutrition.
- **Coach mode in the mobile app** — same app, role-based UI when she logs in with role=coach. For on-the-go work: push notifications and an in-app notifications inbox, trainees list, trainee detail (onboarding answers, logs, Daily Pump photos, body metrics), and light actions (e.g. publish a ready draft plan, duplicate last week and publish). Full plan editing happens on the web.

Both use the same backend, auth and data. Tapping a "new trainee" push opens that trainee in the app's coach mode.

- **Trainees list**: search, filter by status (new / waiting for plan / active / inactive), time remaining on the 48h window, last activity.
- **Trainee detail**: onboarding answers, current & past plans, workout logs with summaries and Daily Pump photos, body weight / measurements / progress photos, achievements.
- **Plan builder**: create a weekly plan from scratch, from a template, or by duplicating a previous week. Add workouts → add exercises from library → set sets, reps, weight, rest, notes. Save as draft or publish.
- **Templates**: reusable workouts and plans.
- **Notifications**: new trainee, workout completed (optional), plan due soon.
- *(Later)* **AI recommendation panel** inside the plan builder (see §8).
- *(Later)* **Nutrition builder** — food list, per-trainee nutrition plans, templates, AI draft (see §5.6).

## 7. Achievements & Streaks

Achievements are computed server-side from workout logs and body metrics, and shown on Home and in the Workout Summary.

Initial set (extensible, data-driven definitions):
- First workout completed
- 5 / 10 / 25 / 50 / 100 workouts completed
- New personal record (heaviest weight on an exercise)
- Rep milestone (e.g. most reps at a given weight)
- Total volume milestones
- Streaks: consecutive weeks where all planned workouts were completed (and/or consecutive training days)
- First Daily Pump photo, first body-measurement entry

No achievements are based on body weight gain or loss — trainees have different goals and weight-based rewards can be harmful.

## 8. AI Plan Recommendation (later phase)

- When a trainee completes onboarding, an AI job analyzes the answers and generates a **draft plan recommendation** for the coach.
- Grounded in the ATLAS **exercise library** (RAG), so it only suggests exercises that exist in the library.
- Output is a structured draft (workouts, exercises, sets/reps, rationale) that pre-fills the plan builder. **The coach always reviews and edits before publishing.** Nothing AI-generated reaches a trainee directly.
- **Built in Phase 12 (owner decisions, 2026-10-07):** provider = Google Gemini API, **free tier, dev only** (default `gemini-3.8-flash`, fallback `gemini-3.5-flash-lite`, switchable via `AI_MODEL` / `AI_FALLBACK_MODEL`), behind one provider client so a paid provider is a contained change. Sent to the model: her onboarding answers by option id, age in years (not the birth date), rounded height / weight, her three free-text answers trimmed to 500 characters with emails and phone numbers removed — never her name, email, ids, photos, logs or body history. The AI never sets weights and never writes the exercise notes (those are what the trainee sees); its "why" per exercise is coach-only. Only beginner and intermediate exercises are offered (no experience question in onboarding yet). The AI is off in production until a paid tier is configured (see §14).

## 9. Notifications

| Event | Recipient | Channel |
|---|---|---|
| New trainee completed onboarding | Coach | Push |
| Plan published | Trainee | Push |
| Nutrition plan published / updated | Trainee | Push |
| Workout reminder (scheduled day) | Trainee | Push (configurable) |
| Achievement unlocked | Trainee | In-app (push optional) |

Store device push tokens per user. Fail gracefully when push permission is denied.

## 10. Data Model (initial sketch)

- **User**: name, email, passwordHash, role, onboardingStatus, onboardingCompletedAt, pushTokens[], coachId (for trainees)
- **OnboardingResponse**: userId, answers (reuse ATLAS schema; Phase 13a adds nutrition preferences), completedAt
- **Exercise**: reused from ATLAS exercise library
- **Plan**: traineeId, coachId, weekStartDate, status (draft/published), workouts[]
- **Workout** (embedded in Plan or own collection): title, dayOfWeek/order, exercises[{ exerciseId, sets, reps, targetWeight, restSec, notes }]
- **WorkoutLog**: traineeId, planId, workoutId, startedAt, finishedAt, sets[{ exerciseId, setIndex, reps, weight, completed }], rating, notes, pumpPhotoUrl
- **BodyMetric**: traineeId, date, weight?, measurements{...}?, photos[]
- **Achievement**: traineeId, type, value, unlockedAt, sourceLogId
- **Template**: coachId, type (workout/plan), content
- **AIRecommendation** (Phase 12): traineeId, coachId, type (training_plan; nutrition_plan in 13c), status, trigger, the input sent, the validated output, attempts. Plan.aiRecommendationId links a plan to the draft it was loaded from (coach-only).
- *(Later, §5.6)* **FoodItem** (coach food list), **NutritionPlan** (calorie target, meals → portions per group, options, tips, versions), nutrition templates; 13b: **Recipe**, **MealLog**, **WaterLog**

## 11. Technical Notes & Open Decisions

- **Keep from ATLAS**: auth (JWT), user model, onboarding questionnaire & its schema, exercise library + import pipeline, API structure.
- **Remove from ATLAS**: marketing homepage, hero/scroll video, landing sections, any website-only navigation and SEO pages.
- **App packaging (decided)**: **Capacitor** wrapping the existing React + Vite app. Reuses the codebase and gives native push notifications, camera access and app-store builds.
- **Coach UI (decided)**: a **web dashboard** built in React for full management, plus a **coach mode inside the mobile app** (role-based tabs). All share the backend, auth, API types, API client and design tokens.
- **Coach notifications (decided)**: native push to the coach's phone via the mobile app. No web push needed.
- **Photo storage**: private object storage (e.g. S3 / Cloudinary) with signed URLs. Photos are personal data — never public URLs.
- **Timer source of truth**: always the server timestamp.
- **Offline resilience**: active workout state persisted locally and synced on reconnect.
- **Language (decided, 2026-10-07)**: **Hebrew is the default language** of the mobile app and the dashboard, right-to-left everywhere. English is an option in Settings (per user, stored on the server). Launch is in Israel first; other markets later. Israel defaults: `Asia/Jerusalem`, kg, cm, week starts Sunday. Server-built texts follow the user's language. Coach content (food list, tips, notes) is shown as written — never auto-translated. Built in Phase 15.

## 12. Design Direction

The owner leads visual design. These are the ground rules for implementation.

**Design work happens after Phase 15 (Hebrew & RTL)** — the final design is made for the Hebrew, right-to-left app (English is the mirrored variant), not the other way round.

**Feel**: modern, alive, bold. **Sharp cuts** — angled corners and diagonal clip-path shapes rather than soft rounded cards. Pink and white dominate the app.

**Palette** (implement as design tokens / CSS variables, never hard-coded):

| Token | Name | Hex | Use |
|---|---|---|---|
| `--color-primary` | Neon Pink | `#FF006E` | Primary actions, highlights, active states, progress |
| `--color-primary-deep` | Cherry Rose | `#A50047` | Pressed states, pink text on light backgrounds, depth/gradients |
| `--color-bg` | Bright Snow | `#FCFCFC` | App background |
| `--color-surface` | Platinum | `#EEEEEE` | Cards, inputs, sections |
| `--color-border` | Alabaster Grey | `#E2E2E2` | Dividers, borders, disabled |

Accessibility notes:
- Neon Pink on white is ~3.7:1 contrast — fine for large/bold text, icons and buttons, **not** for small body text. Use Cherry Rose (~7.6:1) for small pink text.
- A dark text color token is needed for body copy (e.g. near-black `#111111`).

Design system notes:
- Reuse the ATLAS notch-cutout / bracket button pattern as a basis for the "sharp cuts" language.
- 3D gym & sports icons on the 48h waiting screen (and optionally achievements).
- Motion via GSAP where it adds energy (achievement reveals, countdown, transitions), kept subtle during active workouts.

## 13. Phasing

| Phase | Scope |
|---|---|
| MVP | Auth, onboarding on first launch, 48h waiting screen, coach push notification, coach trainee list + detail, plan builder + publish, trainee Home, Workout, Summary + Daily Pump, Workouts history |
| v1.1 | Profile: body weight, measurements, progress photos; achievements & streaks; templates |
| v1.2 | AI plan recommendation for the coach |
| v1.3 | Nutrition plans |
| Before design work | Hebrew (default) & RTL, English as an option (Phase 15) |

## 14. Backlog

- **Original exercise descriptions** — AI draft, reviewed and approved by the coach, because the imported exercise dataset is not cleared for commercial use (facts only). Until then, the coach's per-exercise notes are the instructions trainees see.
- **Coach custom exercises with her own demo video** — the coach can add her own exercises with a demo video she records (hosted on Cloudinary), since the imported library is text-only (facts only, no media).
- **"plan.updated" notification** — when the coach edits an already-published plan, the trainee should be told her plan changed. (Today only the first publish of a plan notifies.)
- **Notification retention / cleanup** — notifications are kept forever for now; decide how long to keep old ones and add a cleanup.
- **Plan builder: last logged performance** — next to each exercise row, show the trainee's last logged performance for that exercise (weight × reps), to support progressive overload. Needs the workout logs from Phase 8.
- **Coach private notes per trainee** — free notes about a trainee (injuries, preferences), visible only to the coach, never to the trainee.
- **Swap an exercise mid-workout** — the trainee can replace an exercise during a session (e.g. the machine is busy) and note the substitution, so the coach sees what was done instead.
- **"+ Add set"** — extra sets beyond the plan during a session (not in Phase 8: the trainee logs what the coach planned).
- **Workout focus / Do Not Disturb** — fewer interruptions during a workout (native parts scheduled in Phase 5b, the web tip in Phase 9):
  - *Android (native)*: when a workout starts, ask "Turn on Do Not Disturb for this workout?". If yes, request Notification Policy Access once, enable DND during the session, and restore the previous mode on finish / discard / leave.
  - *iOS (native)*: apps can't toggle Focus. A one-time in-app guide shows how to create a Shortcuts automation "When Sistem is opened → Set Focus: Fitness".
  - *All platforms*: Sistem's own push notifications are suppressed during an active session and delivered after it ends.
  - *Web (now)*: when starting a workout, a gentle dismissible tip suggests Focus / Do Not Disturb, with a "Don't show again" option. Copy is a placeholder.
- **Delete a trainee's photos with her account** — account deletion must also delete all her photos from Cloudinary (Daily Pump and progress photos), for privacy compliance.
- **"Summary added" notification (optional)** — tell the coach when a trainee adds or changes her workout summary / Daily Pump photo after finishing. Only if the coach wants it.
- **Split the mobile bundle by role** — lazy-load the coach screens (and other role-only code) so a trainee never downloads coach mode, and the other way round. The mobile bundle was 507 kB after Phase 6b, over Vite's 500 kB warning line.
- **lb for workouts** — workout sets, targets and the session's weight steps are kg only. Phase 10 added kg/lb (and cm/in) for body tracking only (owner decision); extend the same unit setting to workout weights.
- **Progress photo slider** — a before/after slider overlay in Compare (Phase 10 compares side by side).
- **REQUIRED BEFORE LAUNCH — AI provider terms.** Switch AI to a paid tier / provider whose terms exclude training on our data before any real trainee data is sent. The Gemini free tier may use submitted data to improve Google's products; until then, the AI only runs on dev / seed data (the server refuses to run it in production unless `AI_PAID_TIER=true`).
- **REQUIRED BEFORE LAUNCH — Legal.** Privacy policy, terms of use and an in-app consent screen covering health-related onboarding answers, body and Daily Pump photos, and processing by an AI provider. Review with a lawyer (Israeli Privacy Protection Law, Amendment 13) before launch.
- **Onboarding experience-level question** — so the AI plan recommendation can use advanced exercises when appropriate (Phase 12 offers beginner and intermediate exercises only). Onboarding is protected: an owner-approved change with placeholder copy, like the Phase 13a nutrition step.
- **Before making the repo public** — audit the full git history for secrets, coach content, personal data and seed data; rotate any exposed secret; rewrite history if needed. (The repo is private now; `docs/reference/` is gitignored for this reason.)
