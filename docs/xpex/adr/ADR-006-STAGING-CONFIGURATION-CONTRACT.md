# ADR-006: Staging Configuration Contract

Date: 2026-07-17
Status: Proposed
Mission: MISSION-011 — Staging Configuration Matrix

## Context

XpeX Academy needs an auditable staging contract before any Vercel, Railway, PostgreSQL, Redis, storage, DNS, secret, migration, or deploy action. Prior readiness work established Vercel as frontend target, Railway as API/Collab target, managed PostgreSQL as required, Redis as feature-dependent, and S3-compatible storage as expected for non-local media.

## Decision

Adopt the MISSION-011 matrix in `docs/xpex/staging-configuration/` as the staging configuration contract. Use placeholders only, separate public Web variables from backend secrets, keep provider placement explicit, deny automatic Vercel preview access, and require staging-only cookie/domain isolation. The shared placeholder topology is Web `academy-staging.example.com`, API `api.academy-staging.example.com`, Collab `collab.academy-staging.example.com`, Media `media.academy-staging.example.com`, Tenant `{org-slug}.academy-staging.example.com`, and cookie parent `.academy-staging.example.com`.

## Consequences

- Future provisioning can follow an ordered checklist without exposing secrets to Codex or Git.
- Authentication, CORS, tenancy, storage, and Collab decisions are documented before provider mutation, with URL fields using complete URLs and domain variables using hostnames only.
- Some values remain proposed until the Operator approves actual provider projects and domains.

## Open questions

1. Final tenancy mode for Kelle Digital Lab staging: `single` or `multi`.
2. Whether Collab is included in MVP staging.
3. Whether Redis is required for selected API features beyond Collab.
4. Exact S3-compatible provider and CDN/public media strategy.
5. Whether authenticated Vercel previews will remain disabled or use an explicit allowlist.

## Out of scope

No code, workflow, dependency, lockfile, Docker, provider resource, DNS record, secret, deploy, or remote migration is changed by this ADR.

## Recommended next mission

MISSION-012 — Staging Provisioning Plan and Operator Runbook: document the exact human sequence to create Vercel, Railway, PostgreSQL, optional Redis, storage, and secrets without automated provider mutation.
