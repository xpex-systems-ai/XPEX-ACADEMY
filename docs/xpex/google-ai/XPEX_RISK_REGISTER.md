# XPeX Google AI Risk Register

## R1 — Parallel AI architecture
Risk: creating a second gateway beside existing `services/ai`.
Mitigation: extend current provider abstraction and XPeX services.

## R2 — Consumer subscription confusion
Risk: assuming Google AI Pro equals production API quota.
Mitigation: keep consumer access separate from backend API configuration and billing.

## R3 — Secret exposure
Risk: provider keys in Next.js client or public environment variables.
Mitigation: server-side secrets only. No private key under `NEXT_PUBLIC_*`.

## R4 — Tenant data leakage
Risk: RAG or AI history crossing organization/Polo boundaries.
Mitigation: preserve org_id scoping, membership checks and RBAC before retrieval/generation.

## R5 — Unbounded AI cost
Risk: unlimited generation endpoints.
Mitigation: existing AI credits/plans + rate limiting + job telemetry + feature flags.

## R6 — Video request timeouts
Risk: synchronous text-to-video request blocks web worker.
Mitigation: existing XPeX video job model; use asynchronous jobs and persisted state.

## R7 — Model hard-coding
Risk: provider/model IDs spread across feature code.
Mitigation: keep model tiers/config centralized.

## R8 — Existing product regression
Risk: breaking auth, courses, invites, Polo flows, communities or media.
Mitigation: small PRs, no framework migration, no destructive migrations, CI + production smoke tests.

## R9 — Hallucinated course guidance
Risk: tutor answers beyond authorized course material.
Mitigation: course-grounded mode, citations/sources where available, explicit general mode separation.

## R10 — Asset rights/provenance
Risk: generated/imported assets lack license/source metadata.
Mitigation: inventory first, then asset metadata including source, owner, rights and generated_by.

## R11 — AGPL obligations
Risk: downstream distribution ignores the base repository license.
Mitigation: preserve license/attribution and review distribution obligations before commercialization.
