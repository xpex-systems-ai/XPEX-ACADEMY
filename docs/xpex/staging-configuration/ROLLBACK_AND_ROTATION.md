# Rollback and Rotation

## Documentation rollback

Revert the MISSION-011 documentation commit. Runtime impact is none because no provider state, secrets, deploy, or code changed.

## Future runtime rollback

- Web variable error: restore last approved Vercel variables and redeploy Web only.
- API variable error: restore last approved Railway API variables and restart API.
- Cookie domain error: restore domain, clear staging cookies, retest login.
- CORS error: restore narrow allowlist; deny previews until retested.
- DB credential error: rotate DB credential and update Railway API only.
- Redis error: disable optional API cache or restart Collab with corrected Redis URL.
- Storage credential error: revoke key, issue least-privilege replacement, retest upload/download.

## Rotation requirements

- JWT and internal keys: rotate on exposure, before production cutover, and when staff/provider access changes.
- Database, Redis, storage, email, AI, Stripe, and observability secrets: rotate per provider policy and on exposure.
- Shared secrets require coordinated service restarts and a rollback window.
