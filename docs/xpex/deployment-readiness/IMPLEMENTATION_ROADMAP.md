# Deployment Readiness Implementation Roadmap

| Mission | Goal | Output | Deploy allowed? |
|---|---|---|---|
| MISSION-010 | API Container Port and Bind Hardening | Functional hardening for explicit `0.0.0.0` bind, provider `PORT` fallback strategy, and aligned health check | No provider provisioning |
| MISSION-011 | Approve staging configuration matrix | Final env names, domains, CORS/cookies, secret owners | No |
| MISSION-012 | Provision PostgreSQL and migration rehearsal | DB resource, backup plan, dry-run/local migration evidence | No production deploy |
| MISSION-013 | Provision S3-compatible storage | Bucket policy, credentials, media smoke plan | No public pilot |
| MISSION-014 | Decide Collab MVP scope | Deploy/disable decision and health strategy | No unless approved |
| MISSION-015 | Provision API on Railway staging | API service with health and DB | Staging only |
| MISSION-016 | Provision Web on Vercel staging | Web connected to staging API | Staging only |
| MISSION-017 | Observability and smoke validation | Sentry/monitoring and smoke checklist | Staging validation |

Recommended next mission: MISSION-010 — API Container Port and Bind Hardening, because Railway provisioning should not begin until the API entrypoint has an approved provider-port and `0.0.0.0` bind strategy. The configuration matrix follows after that hardening decision.
