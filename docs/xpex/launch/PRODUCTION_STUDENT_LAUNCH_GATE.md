# Production Student Launch Gate — XPEX-LAUNCH-001

## Decision record

| Field | Audited value |
|---|---|
| Audit date | 2026-08-25 (UTC) |
| Required base | `c8f91cda7f5bd547052be006af145769577a9793` |
| Work branch | `codex/fix-e-validar-percurso-do-aluno-em-producao` |
| Canonical URL | **Unconfirmed.** `https://xpex-academy-ai.vercel.app` is only a candidate from older documentation. |
| Decision | **NO-GO** |

Codex Cloud environments may materialize this branch as a local `work` branch
with a synthetic SHA; the remote PR is the canonical state.

The repository snapshot has no Git remote or provider metadata, and outbound
HTTP checks of all three known Vercel candidates were blocked by the execution
environment. No production account, test tenant, controlled published course,
mailbox evidence, or authorized production access was available. Consequently,
this audit does not claim that the production golden path passed.

## Effective architecture and fail-closed controls

The web application is a Next.js deployment. Its runtime wrapper copies public
configuration to the browser and refuses to boot in deployed mode unless
`NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` is an absolute, public HTTPS origin. The
web configuration likewise rejects missing, non-HTTPS, loopback, credentialed,
or path-bearing upstream values in production. The API is the LearnHouse
service backed by PostgreSQL and Redis; session, organization membership, role,
course authorization, and progress are resolved server-side. Password recovery
uses the Brevo transactional API over HTTPS when
`LEARNHOUSE_EMAIL_PROVIDER=brevo`, with `LEARNHOUSE_BREVO_API_KEY` held only in
the API provider's secret store.

No migration, deployment, production mutation, pilot bootstrap, or secret read
was performed in this mission.

## Automated checks

Run the deterministic repository check without production access:

```bash
cd apps/web
bun test tests/production-student-launch-gate.test.mjs
```

The live tests report **skipped**, not passed, until the operator supplies the
confirmed public origin (not a credential):

```bash
cd apps/web
XPEX_LAUNCH_BASE_URL=https://<canonical-host> \
  bun test tests/production-student-launch-gate.test.mjs
```

This smoke verifies HTTPS, `/`, `/login`, `/forgot`, and the anonymous `/xpex`
redirect with destination preservation. It performs no signup, login, reset,
or data mutation.

## Manual production procedure

Use a controlled student account and a controlled tenant/course. Record only
timestamps, HTTP status classes, entity labels safe for the audit, and pass/fail
results—never passwords, JWTs, reset tokens, cookies, authorization headers, or
secret environment values.

1. Operator confirms the canonical Vercel project/domain and the matching
   Railway service. Confirm the Vercel production environment contains a public
   HTTPS `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` for that API, with no localhost or
   `/api/v1` suffix. Confirm API readiness.
2. Open `/xpex` in a fresh browser context and verify redirect to
   `/login?next=%2Fxpex`; authenticate the controlled student and verify return
   to `/xpex`.
3. In browser network tools, confirm the API session resolves the expected
   organization and student membership. Repeat with a controlled account that
   has no valid membership and expect denial/empty access.
4. Attempt controlled identifiers from a second tenant for organization,
   course, and first activity. Every request must be denied without disclosing
   tenant data.
5. Verify `/xpex` contains no fabricated metrics. Open `/xpex/courses`; confirm
   only enrolled, published courses appear. Verify honest empty/error states for
   no membership, no enrollment, no published course, unavailable backend, and
   expired session.
6. Open the controlled course and its first authorized activity. Complete it,
   reload, navigate away/back, then log out and log in again. Completion must
   remain after every step.
7. Log out and confirm protected API access fails and `/xpex` again redirects
   while preserving the destination.
8. From `/forgot`, request recovery. Confirm Brevo accepted the request and the
   controlled mailbox received it. Confirm the link uses the canonical frontend,
   reset the password, confirm reuse of the token fails, then log in with the new
   password. Restore the controlled account according to operator policy.
9. Review redacted web/API/provider logs for the entire window. Fail the gate if
   they contain a password, full JWT, reset token, Brevo key, session cookie,
   Authorization value, or secret environment content.

## Golden-path evidence matrix

| Stage | Result | Evidence available | Blocker / required action |
|---|---|---|---|
| Repository base | PASS | Branch created at required SHA | None |
| Canonical HTTPS URL | BLOCKED | Three candidates documented; none provider-confirmed | Operator identifies canonical Vercel project/domain |
| Frontend → API/readiness | BLOCKED | Code is fail-closed; deployed value unavailable | Operator verifies Vercel public env and Railway readiness |
| Public pages and redirect | BLOCKED | Reproducible smoke added | Run smoke from a network that reaches canonical production |
| Login and session | BLOCKED | Native implementation exists | Controlled account and authorized production run |
| Membership resolution | BLOCKED | Server-side model exists | Controlled positive and negative memberships |
| Cross-tenant isolation | BLOCKED | No production probe authorized | Two controlled tenants; prove all three denials |
| Real `/xpex` dashboard | BLOCKED | Static tests exist; no live evidence | Inspect controlled account and honest empty states |
| Authorized catalog/course/activity | BLOCKED | Native routes exist | Controlled published enrollment and live run |
| Completion persistence | BLOCKED | Persistence implementation exists | Complete/reload/navigate/re-login evidence |
| Logout/invalidation | BLOCKED | Auth tests exist; no live evidence | Controlled live session evidence |
| Brevo recovery | BLOCKED | HTTPS provider and unit tests exist | Sender state, mailbox delivery, reset and non-reuse evidence |
| Secret-free logs | BLOCKED | No production log access | Authorized, redacted log review |

Any blocked security, authentication, authorization, persistence, recovery, or
frontend/API row is launch-blocking; therefore **NO-GO** is mandatory.

## CI/workflow classification

- **Executed and passed:** the deterministic Launch Gate validation and the
  applicable backend-runtime, public-root, XpeX authorization, and native
  learning web tests passed locally after the P2 corrections. The 75 focused
  API tests for email delivery, password reset, XpeX dashboard, and pilot
  controls also passed, as did the focused Ruff check.
- **Passed with conditional tests skipped:** the Launch Gate command completed,
  but all four live-production probes were explicitly skipped because
  `XPEX_LAUNCH_BASE_URL` was not available. This is not production evidence.
- **Blocked by the local dependency environment:** Web Lint could not load
  `eslint-plugin-unused-imports`, and Web Build could not find the `next` binary.
  Neither command is classified as passed.
- **Not executed for this correction:** the complete API and general E2E suites.
  Earlier reported workflow success is not substituted for an execution on this
  commit.
- **Manual validation pending:** canonical-domain/provider configuration,
  readiness, authenticated Wave 0, tenant isolation, persisted progress, Brevo
  delivery/reset, and redacted-log review.
- `Staging build` authenticates to GCP only on pushes and requires configured
  workload identity/service-account/project secrets. It is not evidence for the
  documented Railway production path and must not receive fabricated values.
- `Build Community Images` targets upstream `ghcr.io/learnhouse/app`; this fork
  does not own that namespace. The workflow is not part of the Vercel/Railway
  golden path and needs a separate ownership decision rather than a bypass.
- General E2E assignment, SCORM, and rate-limit failures remain separate known
  work. They must stay visible and must not be described as green.
- Repository inspection could not audit open PRs, branch protection, rulesets,
  required checks, or provider project settings because this checkout has no
  remote/provider authorization. PRs #61, #42, and #4 were not modified.

## Residual risks and release waves

The primary risk is absence of production evidence, not a waived inconvenience.
Do not release students while the decision is NO-GO. After every matrix row is
proven, begin only with **Wave 0: operator + teacher + one controlled student**.
Then expand to at most 5, at most 20, and finally the full cohort. At each wave
observe login success, 4xx/5xx, rate limiting, player abandonment, persisted
progress, recovery requests, email failures, and authorization incidents. Stop
expansion on any regression; require a stable observation window and explicit
operator sign-off before the next wave.

## Rollback

1. Stop invitations and expansion; do not delete users or learning records.
2. Repoint the Vercel production deployment to the last known-good commit and
   restore only the previously recorded public frontend/API origin settings.
3. If recovery alone regresses, restore the last known-good API deployment and
   provider configuration; do not change PostgreSQL, Redis, JWT, or unrelated
   secrets. Revoke/rotate a credential only through the provider if exposure is
   suspected.
4. Re-run readiness, anonymous redirect, controlled login, tenant denial,
   progress persistence, logout, and recovery before resuming Wave 0.

## Required human checkpoint

An authorized operator must provide only: the canonical production URL; whether
a controlled student, authorized test organization, published enrolled course,
verified Brevo sender, and production access exist. The operator then executes
or witnesses the manual procedure and attaches redacted evidence. Until that
checkpoint completes, the final result remains **NO-GO**.
