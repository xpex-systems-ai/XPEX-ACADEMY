# CORS Policy

The API middleware allows credentials and computes a tenancy-aware origin regex. Therefore staging must use an explicit, narrow policy.

| Input | Staging value | Required | Rule | Evidence |
|---|---|---|---|---|
| `LEARNHOUSE_ALLOWED_ORIGINS` | `https://academy-staging.example.com` | Yes | CSV allowlist of approved Web origins only. | `apps/api/config/config.py` |
| `LEARNHOUSE_ALLOWED_REGEXP` | `^https://([a-z0-9-]+\.)?academy-staging\.example\.com$` | Proposed for multi-tenancy | Must match only staging tenant hosts, never all Vercel previews or production. | `apps/api/src/core/middleware/cors.py` |
| Credentials | `true` in code | Yes | No wildcard origin with credentials. | `apps/api/src/core/middleware/cors.py` |
| Methods | `*` in code | Existing | Accepted only because origins are restricted. | `apps/api/src/core/middleware/cors.py` |
| Headers | `*` in code | Existing | Accepted only because origins are restricted. | `apps/api/src/core/middleware/cors.py` |
| Localhost | Not present in staging variables | Yes | Localhost is local-only. | `apps/api/src/core/middleware/cors.py` |

## Vercel preview policy

Default: preview URLs do not receive automatic authenticated access to the staging API.

Allowed future options, requiring explicit approval:

1. Add a short-lived explicit preview origin to `LEARNHOUSE_ALLOWED_ORIGINS`.
2. Use a regex pinned to one Vercel project and branch pattern.
3. Keep previews unauthenticated; recommended until validation exists.

## Validation scenarios

- Approved Web origin receives CORS headers and credential support.
- Unknown origin receives no credentialed access.
- Production origin is denied.
- Vercel preview origin is denied unless explicitly approved.
- Tenant staging subdomain is accepted only when `LEARNHOUSE_TENANCY=multi` and regex is restricted.
