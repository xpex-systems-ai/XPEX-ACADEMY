# Provisioning Checklist

Future-only runbook; do not execute in MISSION-011.

1. Human approval: confirm shared staging topology (`academy-staging.example.com`, `api.academy-staging.example.com`, `collab.academy-staging.example.com`, `media.academy-staging.example.com`, `{org-slug}.academy-staging.example.com`, `.academy-staging.example.com`), tenancy mode, Collab scope, Redis requirement, storage provider, and owner list.
2. Create provider projects for staging only: Vercel Web, Railway API, optional Railway Collab.
3. Create managed PostgreSQL staging database.
4. Decide Redis: create only if API features or Collab require it.
5. Create S3-compatible staging bucket and least-privilege credentials.
6. Configure Web public variables in Vercel, keeping `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` as the pure host `academy-staging.example.com` and direct API URL variables versioned as `https://api.academy-staging.example.com/api/v1/`.
7. Configure Railway API runtime variables, keeping `LEARNHOUSE_DOMAIN`/`LEARNHOUSE_FRONTEND_DOMAIN` protocol-free when the code expects domains, `LEARNHOUSE_ALLOWED_ORIGINS` as full HTTPS origins, and `LEARNHOUSE_COOKIE_DOMAIN=.academy-staging.example.com`.
8. Insert Railway API secrets directly in provider UI/authorized mechanism.
9. Configure Railway Collab variables/secrets only if Collab is in scope.
10. Configure placeholder/custom domains only after DNS approval.
11. Run migration rehearsal only in a separately authorized mission.
12. Deploy only after validation checklist is approved.

## Pre-provisioning blockers

- Any need for a real secret in docs.
- Any unresolved conflict between code and matrix.
- Any request to share production resource values.
- Any requirement to mutate provider state from Codex.
