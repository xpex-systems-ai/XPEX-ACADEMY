# Domain and URL Matrix

All values are placeholders and must be replaced by the Operator only inside provider configuration after approval.

| Endpoint | Logical value | Service | Provider location | Required | Evidence | Decision |
|---|---|---|---|---|---|---|
| Web public URL | `https://academy-staging.example.com` | Web | Vercel domain + `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` | Yes | `docs/xpex/deployment-readiness/VERCEL_READINESS.md` | Proposed canonical staging UI. |
| API public URL | `https://api-academy-staging.example.com` | API | Railway domain + web public API vars | Yes | `docs/xpex/deployment-readiness/RAILWAY_READINESS.md` | Proposed canonical API. |
| API internal URL | `${RAILWAY_PRIVATE_API_URL}` | API/Collab | Railway Collab `LEARNHOUSE_API_URL` | Optional | `docs/xpex/deployment-readiness/STAGING_TOPOLOGY.md` | Prefer internal only after provider validation. |
| Collab public URL | `https://collab-academy-staging.example.com` | Collab | Railway Collab | Optional | `docs/xpex/deployment-readiness/RAILWAY_READINESS.md` | Disabled unless collaboration is in MVP. |
| WebSocket endpoint | `wss://collab-academy-staging.example.com` | Web/Collab | Vercel public config if code requires it | Optional | `apps/collab` deployment docs/readiness | Same lifecycle as Collab. |
| Storage endpoint | `${S3_COMPATIBLE_ENDPOINT}` | API | Railway API secret/config store | Yes for S3 mode | `apps/api/config/config.py` | Must not include credentials in URL. |
| Storage public base | `https://media-academy-staging.example.com` | Web/API | CDN/storage config | Optional | `docs/xpex/deployment-readiness/STAGING_TOPOLOGY.md` | Placeholder; no bucket/DNS now. |
| Cookie domain | `.academy-staging.example.com` | API auth | Railway API `LEARNHOUSE_COOKIE_DOMAIN` | Yes for shared subdomains | `apps/api/config/config.py` | Use staging-only parent; never production. |
| Allowed origin | `https://academy-staging.example.com` | API CORS | Railway API `LEARNHOUSE_ALLOWED_ORIGINS` and/or regex | Yes | `apps/api/src/core/middleware/cors.py` | Explicit allowlist only. |
| Tenant URL pattern | `https://{org-slug}.academy-staging.example.com` | Web/API | `LEARNHOUSE_DOMAIN`, tenancy config | Proposed | `apps/api/config/config.py` | Pilot slug remains placeholder until provisioning. |
| Auth redirects | Same-origin paths plus approved Web URL | Web/API | Application env/provider config | Yes | frontend/API redirect search | Open redirects remain out of scope; validate post-config. |
| Custom domains | None | Web/API | Not provisioned | No | custom-domain service/tests search | Real custom domains are out of scope for staging setup. |

## Domain rules

1. Staging and production must not share cookie domains, buckets, databases, Redis instances, JWT secrets, or provider projects.
2. Vercel preview URLs do not receive authenticated API access by default.
3. Localhost remains local-only and must not be present in staging CORS after provider configuration.
4. If Web and API do not share a controlled parent domain, cookie behavior must be re-approved before deploy.
