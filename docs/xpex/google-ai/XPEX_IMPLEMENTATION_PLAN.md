# XPeX Google AI Implementation Plan

## Phase 0 — completed discovery baseline

Confirmed from real repository:

- Next.js web + FastAPI API
- Postgres + Redis
- multi-tenant org/Polo model
- RBAC/auth already implemented
- provider-agnostic AI layer already implemented
- Gemini/OpenRouter support already present
- RAG, image, audio, course planning and generation history already present
- XPeX course factory/editorial/video studio already present
- org-level AI credit controls already present

Therefore: no rewrite.

## Phase 1 — foundation hardening

1. create an authenticated AI Gateway health/capability endpoint
2. expose provider/model capability metadata without secrets
3. add integration feature flags where needed
4. preserve centralized model routing
5. add request/job correlation IDs to new XPeX AI flows
6. document Google API variables and separation from consumer Google AI Pro

Acceptance:
- gateway reports configured capabilities
- no secret values returned
- existing routes unchanged

## Phase 2 — Tutor golden flow

Use existing RAG + chat stack.

Acceptance:
- authenticated enrolled student
- real lesson context
- authorized retrieval only
- streamed answer
- usage tracked
- graceful provider failure

## Phase 3 — Creator / Teacher Studio

Reuse editorial studio + course factory.

Add source ingestion, lesson plan, storyboard and controlled generated assets.

Teacher approval remains mandatory before publish.

## Phase 4 — Asset Vault

Inventory existing storage before moving anything.

Index brand, images, video, audio, avatars, templates, course assets and generated media.

## Phase 5 — Video

Keep XPeX video jobs as orchestration layer.

Connect only supported production APIs/providers.

Required states:
QUEUED → GENERATING → REVIEW → APPROVED → ATTACHED → PUBLISHED / FAILED

## Phase 6 — Enterprise

Extend existing org/RBAC/plans layer with:
- per-org AI provider policy
- quotas
- cost analytics
- audit events
- feature flags
- admin controls

## Deployment rule

Every phase:
branch → PR → CI → merge to dev → Railway deployment → health/smoke verification.
