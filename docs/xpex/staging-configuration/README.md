# Staging Configuration Matrix — MISSION-011

Status: proposed governance contract for XpeX Academy staging. No provider resource, DNS record, deploy, migration, or secret is created by this document set.

All endpoint values are placeholders. The approved logical topology is:

| Surface | Placeholder | Provider | Notes |
|---|---|---|---|
| Web | `https://academy-staging.example.com` | Vercel | Public frontend only. |
| API | `https://api-academy-staging.example.com` | Railway API | Public API and health endpoint. |
| API internal | `${RAILWAY_PRIVATE_API_URL}` | Railway API | Use only if Railway private networking is explicitly available and validated. |
| Collab | `https://collab-academy-staging.example.com` | Railway Collab | Optional until MVP collaboration scope is approved. |
| Storage public base | `https://media-academy-staging.example.com` | S3-compatible/CDN | Placeholder; bucket must remain private unless explicitly approved. |
| Cookie parent | `.academy-staging.example.com` | Railway API config | Proposed only when Web/API/tenant subdomains share one controlled parent. |

## Documents

- [Domain and URL matrix](DOMAIN_AND_URL_MATRIX.md)
- [Environment matrix](ENVIRONMENT_MATRIX.md)
- [CORS policy](CORS_POLICY.md)
- [Cookie and auth policy](COOKIE_AND_AUTH_POLICY.md)
- [Secret ownership](SECRET_OWNERSHIP.md)
- [Provider placement](PROVIDER_PLACEMENT.md)
- [Provisioning checklist](PROVISIONING_CHECKLIST.md)
- [Staging validation checklist](STAGING_VALIDATION_CHECKLIST.md)
- [Rollback and rotation](ROLLBACK_AND_ROTATION.md)
- [ADR-006](../adr/ADR-006-STAGING-CONFIGURATION-CONTRACT.md)

## Evidence read for this mission

- `.github/copilot-instructions.md`
- `docs/trinity-flow/EXECUTION_PROTOCOL.md`
- `docs/xpex/deployment-readiness/ENVIRONMENT_VARIABLES.md`
- `docs/xpex/deployment-readiness/VERCEL_READINESS.md`
- `docs/xpex/deployment-readiness/RAILWAY_READINESS.md`
- `docs/xpex/deployment-readiness/SECURITY_AND_SECRETS.md`
- `docs/xpex/deployment-readiness/STAGING_TOPOLOGY.md`
- `docs/xpex/deployment-readiness/BLOCKERS_AND_RISKS.md`
- `apps/api/config/config.py`
- `apps/api/src/core/middleware/cors.py`
- Repository searches for `LEARNHOUSE_COOKIE_DOMAIN`, `LEARNHOUSE_ALLOWED_ORIGINS`, `LEARNHOUSE_ALLOWED_REGEXP`, `LEARNHOUSE_DOMAIN`, `LEARNHOUSE_FRONTEND_DOMAIN`, `NEXT_PUBLIC_LEARNHOUSE_*`, redirects, cookies, custom domains, and org slugs.

## Hard boundaries

- No real values, credentials, personal data, or provider identifiers are recorded.
- No Vercel, Railway, PostgreSQL, Redis, storage, DNS, deploy, or migration action is authorized here.
- No application code, Dockerfile, workflow, dependency, or lockfile is changed by MISSION-011.
