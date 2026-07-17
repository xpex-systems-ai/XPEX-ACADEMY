# Security and Secrets

## Boundaries

- Vercel receives only public `NEXT_PUBLIC_*` values and non-secret public IDs.
- Railway API receives backend runtime secrets: JWT, database, Redis, storage, email, AI, Stripe, internal keys and observability tokens.
- Railway Collab receives only the Collab-required subset: JWT secret, internal key, API URL and Redis URL.
- GitHub stores source and CI configuration only; no new repository secrets were added in this mission.

## Risks

| Risk | Severity | Notes |
|---|---|---|
| Weak/missing JWT secret | P0 | API explicitly refuses boot without strong secret; Collab exits without it |
| Database URL in frontend env | P0 | Would expose persistence credentials |
| Broad cookie domain | P1 | Config warns/guards broad parent domains; tenant leakage risk must be reviewed |
| Filesystem storage on ephemeral platform | P1 | Media loss/inconsistency risk |
| Collab internal key mismatch | P1 | Breaks board persistence/auth between Collab and API |
| Optional provider keys absent | P2 | AI/email/billing/analytics degraded, not boot-blocking unless feature is in scope |

No credential values were copied into these documents.
