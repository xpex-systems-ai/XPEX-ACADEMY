# Domain and URL Matrix

All values are placeholders and must be replaced by the Operator only inside provider configuration after approval. Host/domain variables use hostnames only; URL fields use complete URLs.

| Endpoint/config | Host/domain value | URL/origin value | Service | Provider location | Required | Evidence | Decision |
|---|---|---|---|---|---|---|---|
| Web public host | `academy-staging.example.com` | `https://academy-staging.example.com` | Web | Vercel domain + `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` | Yes | `docs/xpex/deployment-readiness/VERCEL_READINESS.md` | `NEXT_PUBLIC_LEARNHOUSE_DOMAIN` must be the pure host without protocol. |
| API public host | `api.academy-staging.example.com` | `https://api.academy-staging.example.com/api/v1/` | API | Railway domain + web public API vars | Yes | `docs/xpex/deployment-readiness/RAILWAY_READINESS.md` | Direct API base consumed by Web is versioned and ends with `/api/v1/`. |
| API internal host | `${RAILWAY_PRIVATE_API_HOST}` | `${RAILWAY_PRIVATE_API_URL}/api/v1/` | API/Collab | Railway Collab `LEARNHOUSE_API_URL` if private networking is approved | Optional | `docs/xpex/deployment-readiness/STAGING_TOPOLOGY.md` | Prefer internal only after provider validation; still use versioned API URL when consumed directly. |
| Collab public host | `collab.academy-staging.example.com` | `https://collab.academy-staging.example.com` | Collab | Railway Collab | Optional | `docs/xpex/deployment-readiness/RAILWAY_READINESS.md` | Disabled unless collaboration is in MVP. |
| WebSocket endpoint | `collab.academy-staging.example.com` | `wss://collab.academy-staging.example.com` | Web/Collab | Vercel public config if code requires it | Optional | `apps/collab` deployment docs/readiness | Same lifecycle as Collab. |
| Storage endpoint | Provider endpoint host | `${S3_COMPATIBLE_ENDPOINT}` | API | Railway API secret/config store | Yes for S3 mode | `apps/api/config/config.py` | Must not include credentials in URL. |
| Media public host | `media.academy-staging.example.com` | `https://media.academy-staging.example.com` | Web/API | CDN/storage config | Optional | `docs/xpex/deployment-readiness/STAGING_TOPOLOGY.md` | Placeholder; no bucket/DNS now. |
| Cookie parent | `.academy-staging.example.com` | Not a URL | API auth | Railway API `LEARNHOUSE_COOKIE_DOMAIN` | Yes for shared subdomains | `apps/api/config/config.py` | Covers Web, API, Collab, and tenant subdomains in staging only. |
| Allowed Web origin | `academy-staging.example.com` | `https://academy-staging.example.com` | API CORS | Railway API `LEARNHOUSE_ALLOWED_ORIGINS` and/or regex | Yes | `apps/api/src/core/middleware/cors.py` | Allowed origins use complete HTTPS origins. |
| Tenant host pattern | `{org-slug}.academy-staging.example.com` | `https://{org-slug}.academy-staging.example.com` | Web/API | `LEARNHOUSE_DOMAIN`, tenancy config | Proposed | `apps/api/config/config.py` | Pilot slug remains placeholder until provisioning. |
| Auth redirects | `academy-staging.example.com` | Same-origin paths plus `https://academy-staging.example.com` | Web/API | Application env/provider config | Yes | frontend/API redirect search | Open redirects remain out of scope; validate post-config. |
| Custom domains | None | None | Web/API | Not provisioned | No | custom-domain service/tests search | Real custom domains are out of scope for staging setup. |

## Domain rules

1. Staging and production must not share cookie domains, buckets, databases, Redis instances, JWT secrets, or provider projects.
2. Vercel preview URLs do not receive authenticated API access by default.
3. Localhost remains local-only and must not be present in staging CORS after provider configuration.
4. URL fields include protocol; `*_DOMAIN` fields use hostnames only.
5. Direct API URL variables consumed by Web use `https://api.academy-staging.example.com/api/v1/` and keep the trailing slash.
