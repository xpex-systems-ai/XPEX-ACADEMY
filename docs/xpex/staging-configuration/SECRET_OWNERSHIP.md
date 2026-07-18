# Secret Ownership Matrix

Codex must never receive or record real secret values. The Operator inserts approved values directly in provider stores.

| Secret/config | Owner | Store | Rotation | Shared? | Notes |
|---|---|---|---|---|---|
| `LEARNHOUSE_AUTH_JWT_SECRET_KEY` | Operator: Junior Sena | Railway API secret; Railway Collab only if required | Rotate on exposure, staff change, pre-production cutover | API/Collab minimal share | Generate with cryptographic randomness; rotation invalidates sessions. |
| `LEARNHOUSE_SQL_CONNECTION_STRING` | Operator | Railway API secret | Rotate on DB credential change/exposure | API only | Managed PostgreSQL staging only. |
| `LEARNHOUSE_REDIS_CONNECTION_STRING` | Architect/Operator | Railway API secret | Rotate on exposure/provider change | API only | Optional for API features. |
| `LEARNHOUSE_REDIS_URL` | Operator | Railway Collab secret | Rotate on exposure/provider change | Collab only | Required if Collab is deployed. |
| `COLLAB_INTERNAL_KEY` | Operator | Railway API + Collab secrets | Rotate both services together | API/Collab | Keep out of Vercel and GitHub. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Operator | Railway API secret | Rotate on exposure/provider policy | API only | Prefer least-privilege bucket policy. |
| Email, AI, Stripe, Tinybird, Judge0 secrets | Feature owner + Operator | Railway/API or provider store | Per provider and on exposure | Service-specific | Provision only in feature missions. |

## Human/technical roles

- Operator: approves and inserts values in providers.
- Architect: defines contract and audits separation.
- Builder/Codex: documents names and placeholders only.
- Provider: stores values with least privilege.

## Rules

1. Secrets are not sent through chat, committed, logged, or copied into docs.
2. Every shared secret must have a written reason.
3. GitHub must not store runtime secrets unless a future workflow explicitly needs them.
4. Secret rotation must include rollback and session/cache invalidation impact.
