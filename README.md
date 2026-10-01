# Sistem

Sistem is a mobile coaching app that connects a personal **Coach** with her **Trainees**.
A trainee signs up, completes an onboarding questionnaire, receives a weekly training
plan built by the coach, follows and logs workouts, and tracks progress. The coach
manages trainees and builds plans from a web dashboard and a coach mode in the app.

This repository is a fork of ATLAS that is being converted step by step.
See [`docs/PRD.md`](./docs/PRD.md) for the product and
[`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md) for the phase plan.

## Repository layout (npm workspaces)

| Path | Package | What it is |
|---|---|---|
| `apps/mobile` | `@sistem/mobile` | Mobile app — React 19, Vite, TypeScript, React Router, axios, GSAP, plain CSS. Trainee and coach mode by role. To be wrapped with Capacitor. |
| `apps/dashboard` | `@sistem/dashboard` | Coach web dashboard — React + Vite (desktop-first). |
| `apps/server` | `@sistem/server` | API — Node.js, Express 5, TypeScript, MongoDB (Mongoose), JWT auth. Vitest + mongodb-memory-server. |
| `packages/types` | `@sistem/types` | API contract types shared by all three. |
| `packages/api-client` | `@sistem/api-client` | axios client factory + shared auth calls. |
| `packages/tokens` | `@sistem/tokens` | Design tokens (`tokens.css`, PRD §12). |

## Running locally

Prerequisites: Node.js ≥ 20.19 and a MongoDB connection string. Everything runs from the
repo root; there is one `npm install` and one lockfile.

```bash
npm install
cp apps/server/.env.example apps/server/.env         # then fill in the values
cp apps/mobile/.env.example apps/mobile/.env
cp apps/dashboard/.env.example apps/dashboard/.env
npm run dev        # server (http://localhost:5002) + mobile app (http://localhost:5173)
npm run dev:all    # + coach dashboard (http://localhost:5174)
```

The onboarding videos (`apps/mobile/src/assets/onBoardingvid/`) are not in the repo yet;
the mobile app only builds where they exist locally (moved to Cloudinary in Phase 2c).

### Optional data

```bash
npm run import:exercises          # exercise library from the Kaggle CSV (facts only)
npm run seed:workout-templates    # ready-made workout templates
npm run seed:knowledge            # knowledge base embeddings (needs VOYAGE_API_KEY)
npm run seed:dev                  # DEV ONLY: 1 coach + 2 onboarded trainees (one with a plan)
npm run promote:coach -- <email>  # DEV ONLY: make an existing user a coach
```

`seed:dev` and `promote:coach` refuse to run with `NODE_ENV=production` and refuse a
non-local database unless `--allow-remote` is added (they print which database they
will touch). Seed accounts: `coach@sistem.dev`, `trainee1@sistem.dev`,
`trainee2@sistem.dev`, password `sistem-dev-1234`.

New trainees are assigned to the coach in `DEFAULT_COACH_EMAIL` (apps/server/.env), or to
the only coach if there is exactly one; otherwise they stay unassigned until a coach is
promoted or seeded.

### Other commands (from the root)

| Command | What it does |
|---|---|
| `npm run build` | Build every app |
| `npm run lint` | Lint mobile + dashboard (oxlint) |
| `npm test` | Run the server test suite |
| `npm run dev:server` / `dev:mobile` / `dev:dashboard` | Run one app |
| `npm start -w @sistem/server` | Run the compiled server |

## Docs

- [`docs/PRD.md`](./docs/PRD.md) — product requirements (source of truth)
- [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md) — phases and owner decisions
- [`docs/phase-reports/`](./docs/phase-reports/) — one report per completed phase
- [`docs/THIRD_PARTY_CONTENT.md`](./docs/THIRD_PARTY_CONTENT.md) — third-party data and licenses
- [`docs/Onboarding.txt`](./docs/Onboarding.txt) — current onboarding copy
