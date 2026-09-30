# Sistem

Sistem is a mobile coaching app that connects a personal **Coach** with her **Trainees**.
A trainee signs up, completes an onboarding questionnaire, receives a weekly training
plan built by the coach, follows and logs workouts, and tracks progress. The coach
manages trainees and builds plans from a web dashboard and a coach mode in the app.

This repository is a fork of ATLAS that is being converted step by step.
See [`docs/PRD.md`](./docs/PRD.md) for the product and
[`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md) for the phase plan.

## Stack

- **Client** (`client/`) — React 19, Vite, TypeScript, React Router, axios, GSAP, plain CSS.
  To be wrapped with Capacitor.
- **Server** (`server/`) — Node.js ≥ 20, Express 5, TypeScript, MongoDB (Mongoose), JWT auth.
  Tests with Vitest + mongodb-memory-server.

## Running locally

Prerequisites: Node.js ≥ 20 and a MongoDB connection string.

### Server

```bash
cd server
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:5002 (health: GET /api/health)
```

### Client

```bash
cd client
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

The onboarding videos (`client/src/assets/onBoardingvid/`) are not in the repo yet;
the client only builds where they exist locally (moved to Cloudinary in Phase 2c).

### Optional data (from `server/`)

```bash
npm run import:exercises          # exercise library from the Kaggle CSV (facts only)
npm run seed:workout-templates    # ready-made workout templates
npm run seed:knowledge            # knowledge base embeddings (needs VOYAGE_API_KEY)
```

### Other commands

| Command | Where | What it does |
|---|---|---|
| `npm run build` | `client/`, `server/` | Production build |
| `npm start` | `server/` | Run the compiled server |
| `npm test` | `server/` | Run the test suite |
| `npm run lint` | `client/` | Lint the client (oxlint) |

## Docs

- [`docs/PRD.md`](./docs/PRD.md) — product requirements (source of truth)
- [`docs/BUILD_PLAN.md`](./docs/BUILD_PLAN.md) — phases and owner decisions
- [`docs/phase-reports/`](./docs/phase-reports/) — one report per completed phase
- [`docs/THIRD_PARTY_CONTENT.md`](./docs/THIRD_PARTY_CONTENT.md) — third-party data and licenses
- [`docs/Onboarding.txt`](./docs/Onboarding.txt) — current onboarding copy
