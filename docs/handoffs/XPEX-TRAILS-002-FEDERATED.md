# XPEX-TRAILS-002 — Federated Learning Catalog

## Objective

Turn the authenticated XPeX Trails hub into a real learning navigator that connects students to official external academies while keeping XPeX-owned progress trustworthy.

## Active external destinations

- OpenAI Academy
- Microsoft Learn
- AWS Skill Builder
- Grow with Google
- GitHub Learn / Skills
- Vercel Academy
- Notion Academy
- Canva Design School

All destinations must use official provider URLs.

## Integrity rule

External content is not copied into XPeX and does not count toward XPeX course completion, certificates, or progress unless a provider later exposes a compatible authenticated API/OAuth integration and the user explicitly authorizes it.

The UI must clearly distinguish:

- XPeX internal trail: real enrollment + real persisted progress.
- External official academy: outbound learning destination, no inferred progress.

## Security

External links open with `target=_blank` and `rel=noopener noreferrer`.

No provider credentials, API keys, or cookies are stored by this feature.

## Next integration layer

A future XPEX-TRAILS-003 may add provider-specific OAuth/progress adapters only where official APIs and user consent exist. Until then, outbound provider navigation is the production-safe integration mode.
