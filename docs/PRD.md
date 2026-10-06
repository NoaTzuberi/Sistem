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

### 5.6 Nutrition (later phase)
- Coach-assigned meal plan per trainee: meals, foods, portions, notes.
- Trainee views the plan; optional meal logging later.

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
- *(Later)* **Nutrition builder**.

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

## 8. AI Plan Recommendation (later phase)

- When a trainee completes onboarding, an AI job analyzes the answers and generates a **draft plan recommendation** for the coach.
- Grounded in the ATLAS **exercise library** (RAG), so it only suggests exercises that exist in the library.
- Output is a structured draft (workouts, exercises, sets/reps, rationale) that pre-fills the plan builder. **The coach always reviews and edits before publishing.** Nothing AI-generated reaches a trainee directly.

## 9. Notifications

| Event | Recipient | Channel |
|---|---|---|
| New trainee completed onboarding | Coach | Push |
| Plan published | Trainee | Push |
| Workout reminder (scheduled day) | Trainee | Push (configurable) |
| Achievement unlocked | Trainee | In-app (push optional) |

Store device push tokens per user. Fail gracefully when push permission is denied.

## 10. Data Model (initial sketch)

- **User**: name, email, passwordHash, role, onboardingStatus, onboardingCompletedAt, pushTokens[], coachId (for trainees)
- **OnboardingResponse**: userId, answers (reuse ATLAS schema), completedAt
- **Exercise**: reused from ATLAS exercise library
- **Plan**: traineeId, coachId, weekStartDate, status (draft/published), workouts[]
- **Workout** (embedded in Plan or own collection): title, dayOfWeek/order, exercises[{ exerciseId, sets, reps, targetWeight, restSec, notes }]
- **WorkoutLog**: traineeId, planId, workoutId, startedAt, finishedAt, sets[{ exerciseId, setIndex, reps, weight, completed }], rating, notes, pumpPhotoUrl
- **BodyMetric**: traineeId, date, weight?, measurements{...}?, photos[]
- **Achievement**: traineeId, type, value, unlockedAt, sourceLogId
- **Template**: coachId, type (workout/plan), content
- *(Later)* **NutritionPlan**, **AIRecommendation**

## 11. Technical Notes & Open Decisions

- **Keep from ATLAS**: auth (JWT), user model, onboarding questionnaire & its schema, exercise library + import pipeline, API structure.
- **Remove from ATLAS**: marketing homepage, hero/scroll video, landing sections, any website-only navigation and SEO pages.
- **App packaging (decided)**: **Capacitor** wrapping the existing React + Vite app. Reuses the codebase and gives native push notifications, camera access and app-store builds.
- **Coach UI (decided)**: a **web dashboard** built in React for full management, plus a **coach mode inside the mobile app** (role-based tabs). All share the backend, auth, API types, API client and design tokens.
- **Coach notifications (decided)**: native push to the coach's phone via the mobile app. No web push needed.
- **Photo storage**: private object storage (e.g. S3 / Cloudinary) with signed URLs. Photos are personal data — never public URLs.
- **Timer source of truth**: always the server timestamp.
- **Offline resilience**: active workout state persisted locally and synced on reconnect.

## 12. Design Direction

The owner leads visual design. These are the ground rules for implementation.

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
