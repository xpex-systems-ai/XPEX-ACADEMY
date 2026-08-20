# OS-P0-04 live backend and polo activation

## Audited status

Repository audit at baseline `76cb74e219c0962770b152bc01cd35fdf24b9032` found Cloud Run build and deployment runbooks, but no concrete public API hostname, deployed Cloud Run revision, Vercel project binding, pilot credentials, or production data evidence. The checked-in Cloud Build pipeline is explicitly build-only. Therefore the operational classification is **`BACKEND_NOT_DEPLOYED` (or deployment not evidenced)**; XPeX Academy must not be declared live from repository evidence alone.

No organization, membership, user, course, enrollment, or progress record is created by this change. Those records must be provisioned through the canonical API after the backend is healthy.

## Smallest safe activation sequence

1. An authorized operator completes the existing Cloud Run prerequisites (PostgreSQL, Redis, persistent object storage, runtime service account, Secret Manager values, CORS and cookie domains) and deploys `apps/api/Dockerfile` using the reviewed staging runbook.
2. Record the resulting public HTTPS **origin** (for example, the exact Cloud Run service URL). Do not include `/api/v1`, credentials, query parameters, or fragments.
3. Verify `GET <origin>/api/v1/health`, database migrations, Redis, storage, and the organization lookup before connecting Vercel.
4. Set `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL`, `NEXT_PUBLIC_LEARNHOUSE_DOMAIN`, and `NEXT_PUBLIC_LEARNHOUSE_HTTPS=true` intentionally for both Vercel Preview and Production, then redeploy. Never copy secrets into `NEXT_PUBLIC_*` variables.
5. Verify the web readiness signal at `GET /api/readiness/backend`. It returns only configuration state, not the backend hostname or secrets. A `200` with reason `ready` proves configuration shape only; it does not replace the API health check.
6. Provision the real pilot organization, polo operator, teacher, student, published lesson, enrollment, and progress through canonical authenticated APIs. Capture record identifiers and timestamps in protected operational evidence, not in Git.
7. Execute invalid and valid login, session, refresh, logout, cross-organization isolation, student persistence, teacher scope, and polo scope checks against Preview. Promote only after CI and all live checks pass.

## Required operator evidence

- Cloud Run service URL, revision, region, image digest, and successful health timestamp.
- Vercel Preview and Production variable presence (values redacted) and deployment IDs.
- Real pilot organization slug and canonical membership/account record IDs (credentials excluded).
- Real course, lesson, enrollment, and persisted progress record IDs.
- Login/session/logout results plus teacher, student, and polo smoke-test timestamps.

Until that evidence exists, organization, polo membership, teacher/student accounts, login/session, course/lesson/progress, Preview, and live polo smoke tests remain **not validated** and operator action is required.
