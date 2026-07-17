# Health and Observability

## Health

- API has `GET /api/v1/health`; it checks database connectivity and returns failure when the database check fails.
- API Dockerfile defines a curl health check against `/api/v1/health` on port 9000.
- Web has `/health`, which is rewritten to `/api/health` and returns JSON 200 from the app route.
- Collab has `/` and `/health`, both returning HTTP 200 JSON from the Hocuspocus `onRequest` handler.
- Provider health probes still need to be configured and validated against the existing endpoints in Vercel/containerized Web and Railway Collab environments.

## Observability

- API initializes Sentry when `LEARNHOUSE_SENTRY_DSN` is configured, with environment from `LEARNHOUSE_ENV` and PII disabled.
- Web includes Sentry package integration and optional public Sentry/analytics variables.
- Tinybird/PostHog/Loops are optional analytics/marketing paths and should remain disabled until explicitly provisioned.

## Minimum staging monitor set

1. API health check `/api/v1/health`.
2. Vercel build/deploy status for Web.
3. Railway process health for API and optionally Collab.
4. Sentry backend project after approval.
5. Manual smoke: landing page, login route, API root, API health, one authenticated course path if seeded data exists.
