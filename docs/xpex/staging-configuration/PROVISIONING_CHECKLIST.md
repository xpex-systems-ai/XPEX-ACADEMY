# Provisioning Checklist

Future-only runbook; do not execute in MISSION-011.

1. Human approval: confirm domain topology, tenancy mode, Collab scope, Redis requirement, storage provider, and owner list.
2. Create provider projects for staging only: Vercel Web, Railway API, optional Railway Collab.
3. Create managed PostgreSQL staging database.
4. Decide Redis: create only if API features or Collab require it.
5. Create S3-compatible staging bucket and least-privilege credentials.
6. Configure Web public variables in Vercel.
7. Configure Railway API runtime variables.
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
