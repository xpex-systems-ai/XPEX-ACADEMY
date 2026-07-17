# ADR-005 — Staging Deployment Topology

## Status

Proposed; documentary only until human approval.

## Context

XpeX Academy needs a staging topology for the Kelle Digital Lab pilot without performing premature deploys or provider mutations. The monorepo includes Next.js Web, FastAPI API, Hocuspocus/Yjs Collab and a CLI. PostgreSQL, Redis and storage are architecture dependencies.

## Decision

Use Vercel for the Web staging frontend, Railway for the API service, Railway for Collab only if MVP collaboration is approved, managed PostgreSQL for persistence, managed Redis when required by selected features, and S3-compatible private object storage for staging/production media.

## Consequences

- Public frontend variables stay in Vercel; secrets stay in Railway/provider secret stores.
- API health is the primary readiness gate because it validates database connectivity, but the API service is not Railway-ready until container host/port binding is resolved.
- Collab can be deferred if collaborative boards are outside the first pilot scope.
- Filesystem storage is limited to development/local use.
- No deploy, migration or secret creation is authorized by this ADR alone. Railway API provisioning must wait for either Option A manual validation (`LEARNHOUSE_PORT=9000`, route to 9000, bind validation on `0.0.0.0`, fixed health check alignment) or Option B functional hardening of the entrypoint to consume provider `PORT`, fallback to `LEARNHOUSE_PORT`/`9000`, bind explicitly to `0.0.0.0`, and align health checks.

## Follow-up

MISSION-010 should be a small functional `API Container Port and Bind Hardening` mission before provider resources are created. The staging configuration matrix should follow once API host/port behavior is safe for Railway.
