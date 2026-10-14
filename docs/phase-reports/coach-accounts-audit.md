# Coach account creation audit and invite-only proposal

**Scope:** read-only investigation of coach account creation and trainee assignment as of 2026-10-14. This report is the only file changed for this request. No `.env` files or secret values were read or printed.

## Findings

### Production application paths

| Path | Source | Who can trigger it | What it creates or changes |
|---|---|---|---|
| Public registration | [`auth.routes.ts`](../../apps/server/src/features/auth/auth.routes.ts#L7), [`auth.controller.ts`](../../apps/server/src/features/auth/auth.controller.ts#L22-L33), [`auth.validation.ts`](../../apps/server/src/features/auth/auth.validation.ts#L28-L47), [`auth.service.ts`](../../apps/server/src/features/auth/auth.service.ts#L50-L69) | Anyone who can reach `POST /api/auth/register`; route is public | Creates a user with name, email, bcrypt password hash, resolved `coachId`, timezone and optional language. `role` is omitted, so the User model default makes the account a trainee. The controller explicitly extracts only name/email/password/timezone/language; the service constructs a new document from those fields. Request `role` and other extra properties are not forwarded. |
| Coach invite / admin API | No route or feature found | N/A | There is currently no admin role or admin endpoint for creating a coach or invite. |

### Operational and development paths

| Path | Source | Who can trigger it | What it creates or changes |
|---|---|---|---|
| Promote existing user | [`promoteCoach.ts`](../../apps/server/src/features/users/scripts/promoteCoach.ts#L1-L11), [`promoteCoach.ts`](../../apps/server/src/features/users/scripts/promoteCoach.ts#L19-L53); command registered in [`apps/server/package.json`](../../apps/server/package.json#L17-L18) and root [`package.json`](../../package.json#L24-L27) | An operator with shell access and a database connection. Despite the “DEV ONLY” label and production guard, `--allow-remote` permits a non-local DB whenever `NODE_ENV` is not production. | Looks up an existing user by email; if found, sets `role = 'coach'` and `coachId = null`. If the user resolves as the default coach, it assigns currently unassigned trainees to that account. It does not create a new user. |
| Development seed | [`seedDev.ts`](../../apps/server/src/features/users/scripts/seedDev.ts#L41-L47), [`seedDev.ts`](../../apps/server/src/features/users/scripts/seedDev.ts#L106-L115), [`seedDev.ts`](../../apps/server/src/features/users/scripts/seedDev.ts#L195-L216), command registered in [`apps/server/package.json`](../../apps/server/package.json#L17-L19) and root [`package.json`](../../package.json#L24-L27) | An operator with shell access and a DB connection. The guard refuses production and non-local DBs unless `--allow-remote` is supplied. | Creates `coach@sistem.dev` as `Dev Coach`, with `role: 'coach'`, `coachId: null`, timezone default, and a password hash. The password is sourced from `SEED_PASSWORD`, or falls back to a hard-coded development password; value intentionally omitted here. If that email already exists it is left unchanged. Also creates two seed trainees assigned to the seeded coach and development data. |
| Direct database writes | No application-owned DB console or migration script that creates coach accounts was found. `User.role` is a normal persisted field in [`user.model.ts`](../../apps/server/src/features/users/user.model.ts#L75-L92). | A person or process with direct write access to the database can mutate records outside app authorization. | Can set a user role to coach or insert a coach document, subject to schema validation for ordinary Mongoose writes. This is an infrastructure capability, not a supported product flow; database credentials/access policy should be reviewed separately. |

Test code also creates/promotes coach fixtures directly (for example [`apiTestClient.ts`](../../apps/server/src/testing/apiTestClient.ts#L66-L68) accepts arbitrary test fields, and [`roles.test.ts`](../../apps/server/src/features/auth/__tests__/roles.test.ts#L56-L68) verifies a posted role does not elevate the account). These are test-only setup paths and are not reachable by users of the running application.

No other user creation or role-promotion scripts/endpoints were found in the server source. Nutrition seed/reset scripts only find existing coaches and operate on coach-owned data; they do not create or promote accounts.

### Can a trainee self-register as a coach?

**No, not through the current public registration API.** The endpoint is unauthenticated, but the input validation does not consume `role`, the controller passes only the five permitted registration values, and `registerUser` omits `role` when constructing the user. `User.role` defaults to `trainee` in [`user.model.ts`](../../apps/server/src/features/users/user.model.ts#L75-L81) and [`users.constants.ts`](../../apps/server/src/features/users/users.constants.ts#L87-L89). The regression test explicitly posts `role: 'coach'` and asserts the stored and returned role remains `trainee` in [`roles.test.ts`](../../apps/server/src/features/auth/__tests__/roles.test.ts#L56-L68).

The existence of the public route is therefore not itself a privilege-escalation issue. The current implementation has a positive guardrail (role is server-defaulted and excluded from the accepted payload). Coach creation remains possible to trusted shell/database operators through the paths above.

### How trainees are linked to a coach

- A trainee has nullable `coachId` referencing `User` in [`user.model.ts`](../../apps/server/src/features/users/user.model.ts#L41-L44) and [`user.model.ts`](../../apps/server/src/features/users/user.model.ts#L90-L92). There is no invite code or trainee-facing coach-link route found.
- During public sign-up, [`coachAssignment.service.ts`](../../apps/server/src/features/users/coachAssignment.service.ts#L11-L20) chooses the coach whose email matches `DEFAULT_COACH_EMAIL`; if that is empty or unmatched, it falls back only when exactly one coach exists; otherwise it returns null. [`auth.service.ts`](../../apps/server/src/features/auth/auth.service.ts#L58-L67) saves this resolved ID on the new trainee.
- `DEFAULT_COACH_EMAIL` is only a selector, not a coach-creation switch: [`env.ts`](../../apps/server/src/config/env.ts#L20-L21), [`apps/server/.env.example`](../../apps/server/.env.example#L21-L24). No environment flag was found that creates a coach.
- After promotion or seeding, [`coachAssignment.service.ts`](../../apps/server/src/features/users/coachAssignment.service.ts#L22-L25) bulk-assigns existing trainees whose `coachId` is null, but only when the resulting coach is the selected default coach. The promotion call is at [`promoteCoach.ts`](../../apps/server/src/features/users/scripts/promoteCoach.ts#L49-L52); the seed call is at [`seedDev.ts`](../../apps/server/src/features/users/scripts/seedDev.ts#L238-L244).
- The onboarding completion event includes the trainee's existing `coachId` (or null) in [`onboarding.service.ts`](../../apps/server/src/features/onboarding/onboarding.service.ts#L256-L267); onboarding itself does not choose a coach.
- Current product documentation says new trainees are auto-assigned from config/seed and multiple-coach matching remains future work: [`BUILD_PLAN.md`](../../docs/BUILD_PLAN.md#L40-L43), [`PRD.md`](../../docs/PRD.md#L418-L420).

## Proposed invite-only flow (not implemented)

### Suggested lifecycle

1. An administrator invokes a CLI command (preferred for the current project, which has no admin identity/role or admin API) to create an invite for a normalized email address. A protected admin route is an alternative only after an admin authorization model exists.
2. Generate a cryptographically random, high-entropy token. Store only its SHA-256 hash with the normalized invited email, creator/admin identifier, `expiresAt`, `usedAt`, and timestamps. Return or deliver the raw token only in a one-time link; never persist/log the raw token.
3. Link opens a branded coach account setup page using the existing coach login visual language. The coach confirms/sets her name and chooses a password. The page submits invite token, name and password; it does not submit a role.
4. Server validates that the token hash matches an unused, unexpired invite, checks email uniqueness, and atomically consumes the invite while creating the user. Set `role: 'coach'` server-side, set `coachId: null`, hash the password, and issue the normal session only after successful creation. Prevent replay and concurrent double redemption.
5. Expired, consumed, unknown, and email-conflict cases receive safe, non-enumerating responses. Decide operationally whether creation links go by email or are shown once to the administrator; current email support appears focused on password reset and should be checked before implementation.

### Proposed data model

Add a `CoachInvite` collection/model, separate from `User`:

- `email` (normalized; indexed; optionally unique while an invite is active)
- `tokenHash` (required, unique; never raw token)
- `createdBy` (admin/operator reference or auditable actor string, depending on the chosen admin model)
- `createdAt`, `expiresAt`, `usedAt`
- Optional `revokedAt` and `redeemedBy` for explicit revocation and auditability
- Indexes for unique token hash and expiry/cleanup; redemption must also enforce `usedAt: null` and `expiresAt > now` atomically.

No change to `User.role` enum or trainee `coachId` relationship is required for the basic invite flow. Creating a coach account assigns no trainees automatically. If the product wants invite redemption to attach trainees or choose a default coach, that is a separate matching decision; the current `DEFAULT_COACH_EMAIL` behavior can continue as-is until then.

### Files likely to touch in a future implementation

**Server:**

- `apps/server/src/features/users/` or a new `apps/server/src/features/coachInvites/`: invite model/types, service, validation, controller, routes, and hashing/atomic redemption logic.
- `apps/server/src/features/auth/auth.routes.ts` and `auth.service.ts` (or coach-invite routes colocated in a dedicated feature) for unauthenticated invite validation/redemption; preserve regular public registration as trainee-only.
- `apps/server/src/features/users/scripts/` and `apps/server/package.json`, root `package.json` for the admin/operator CLI command.
- `apps/server/src/app.ts` or the existing route registration module to mount the new route; verify exact mount point during implementation.
- `apps/server/src/features/auth/__tests__/roles.test.ts` and new invite-flow tests for role isolation, expiry, replay, email conflict, and concurrent redemption.
- `apps/server/src/features/users/user.model.ts` only if account state or audit fields prove necessary; no User schema change is needed for the minimal design.
- `apps/server/.env.example` only if a public coach setup URL or mail delivery configuration is required (document names only; never commit actual secrets).

**Dashboard and shared contracts:**

- `apps/dashboard/src/app/router/` and a new `apps/dashboard/src/features/auth/pages/CoachInviteSetup/` page with component-level CSS; reuse coach login tokens/layout conventions.
- `apps/dashboard/src/features/auth/` for invite API/service integration; `packages/api-client/` and `packages/types/` if shared API types are needed.
- `apps/dashboard/src/copy/` for approved Hebrew/English interface labels. Exact user-facing copy needs product-owner wording under the project content rules.
- `docs/phase-reports/` for the implementation report after the flow is approved and built.

The existing coach login design report records the current dashboard visual conventions and notes that the prototype reference file was not available: [`design-coach-login.md`](design-coach-login.md). The new setup page should reuse the implemented branded login treatment rather than inventing a separate visual style.

## Security/implementation notes for a future phase

- The CLI is an administrative capability even without a web admin account; production use needs explicit operator authorization and auditing. The current dev scripts' `--allow-remote` mode means the existing DEV ONLY label alone does not prevent changes to a non-production remote database.
- Do not make the invite token a bearer credential with a long lifetime. Hash at rest, expire it, consume it atomically, and avoid putting it in analytics or application logs.
- Keep the coach role assignment inside the server's successful redemption path. Ignore/reject client-supplied `role`, `coachId`, and account status fields.
- `DEFAULT_COACH_EMAIL` affects only future trainee assignment and unassigned trainees during promotion/seed. It does not affect account privileges or create an invite.
