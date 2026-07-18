# Cookie and Auth Policy

## Proposed topology

Staging Web, API, Collab, media, and tenant subdomains should live under one staging-only controlled parent: `academy-staging.example.com`. This enables a staging cookie parent such as `.academy-staging.example.com` without colliding with production.

| Attribute | Staging contract | Evidence/owner |
|---|---|---|
| Cookie names | Code-defined LearnHouse auth cookies; names are not changed by this mission. | API/auth implementation. |
| Domain | `.academy-staging.example.com` only if shared-subdomain auth is required; otherwise exact host. | Architect approval + `LEARNHOUSE_COOKIE_DOMAIN`. |
| Path | `/` unless code defines a narrower path. | API/auth implementation. |
| Secure | Required for HTTPS staging. | Operator validation. |
| HttpOnly | Required for auth tokens where applicable. | API/auth implementation. |
| SameSite | Must support the chosen Web/API domain topology; validate login, refresh, logout. | Architect approval. |
| Expiration | Code-defined token/session expiry; do not document token values. | API/auth implementation. |
| Cross-subdomain | Allowed only inside staging parent domain; `.academy-staging.example.com` covers Web, API, Collab, and `{org-slug}` tenant hosts. | `LEARNHOUSE_COOKIE_DOMAIN`. |
| Custom domains | Not enabled in MISSION-011. | Future custom-domain mission. |

## Auth redirect rules

- Approved redirect origin: `https://academy-staging.example.com`.
- Same-origin relative redirects may be used when already accepted by code.
- Production domains, unapproved previews, and arbitrary external URLs are prohibited.
- Staging and production cookies must never share a parent domain.

## Tenancy rules

- `LEARNHOUSE_TENANCY` must be explicitly approved as `single` or `multi` before provisioning.
- Pilot org slug remains a placeholder such as `{pilot-org-slug}` until setup.
- No production org slug, custom domain, user, or data may be referenced.
- Future validation must cover authenticated user in the pilot org, authenticated user outside the pilot org, and anonymous access.
