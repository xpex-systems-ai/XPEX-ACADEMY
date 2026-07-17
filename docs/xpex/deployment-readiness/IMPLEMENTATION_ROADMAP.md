# Deployment Readiness Implementation Roadmap

| Mission | Goal | Output | Deploy allowed? |
|---|---|---|---|
| MISSION-010 | API Container Port and Bind Hardening | Completed in code: explicit `0.0.0.0` bind, `PORT` > `LEARNHOUSE_PORT` > `9000`, validated port resolver, and aligned health check | No provider provisioning |
| MISSION-011 | Staging Configuration Matrix | Completed as documentation contract: domains, URLs, CORS, cookies/auth, env matrix, secret ownership, provider placement, provisioning and validation checklists | No provider provisioning |
| MISSION-012 | Staging Provisioning Plan and Operator Runbook | Human runbook for Vercel, Railway, PostgreSQL, optional Redis, storage and secret insertion without automated mutation | No production deploy |
| MISSION-013 | Provision S3-compatible storage | Bucket policy, credentials, media smoke plan | No public pilot |
| MISSION-014 | Decide Collab MVP scope | Deploy/disable decision and health strategy | No unless approved |
| MISSION-015 | Provision API on Railway staging | API service with health and DB | Staging only |
| MISSION-016 | Provision Web on Vercel staging | Web connected to staging API | Staging only |
| MISSION-017 | Observability and smoke validation | Sentry/monitoring and smoke checklist | Staging validation |

Recommended next mission: MISSION-012 — Staging Provisioning Plan and Operator Runbook, because MISSION-011 defines the configuration contract without creating provider resources, secrets, database, Redis, migrations or deploys.
