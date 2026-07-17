# Platform Core Gap Analysis

## Pronto

| Capacidade | Evidência | Observação |
|---|---|---|
| Authentication | `apps/api/src/security/auth.py`, `apps/api/src/routers/auth.py` | JWT/refresh/session foundation exists. |
| Users/identity | `apps/api/src/db/users.py`, `apps/api/src/services/users/` | Multiple principal projections exist. |
| Organizations/membership | `apps/api/src/db/organizations.py`, `apps/api/src/db/user_organizations.py` | Tenant spine exists. |
| Roles/RBAC | `apps/api/src/db/roles.py`, `apps/api/src/security/rbac/` | Rights and resource access are centralized. |

## Operacional

| Capacidade | Dependência | Risco |
|---|---|---|
| Billing/plans | Runtime plan catalog, org billing state, billing usage events, Stripe/config/provider setup | Operational but provider/env dependent; no persisted plan entity is listed. |
| Storage/media | Filesystem or S3-compatible backend | Lifecycle and scanning need follow-up. |
| Observability | Sentry/Tinybird optional config | Event taxonomy and audit coverage incomplete. |
| API tokens | Org/rights/token hashing | Rate limits and audit trail need confirmation. |

## Parcial

| Capacidade | Lacuna | Prioridade |
|---|---|---|
| UserGroups | Generic group exists; cohort semantics not formal. | Média |
| Notifications | Email utilities exist; no central notification event bus found. | Média |
| Webhooks | Models/routers exist; delivery guarantees/retry coverage need audit. | Alta |
| Feature Gates | Runtime plan/usage entitlement gates exist; no general flag service. | Média |
| Audit/Governance | Docs/events/logs exist; immutable audit log not proven. | Alta |

## Experimental

| Capacidade | Observação |
|---|---|
| External automation via Zapier | Present as integration path, but should not define the whole webhook architecture until delivery guarantees are reviewed. |
| EE audit UI service | `apps/web/services/ee/audit_logs.ts` indicates an enterprise surface; community-core backend coverage requires separate verification. |

## Ausente

| Capacidade ausente | Impacto | Dependências |
|---|---|---|
| Formal immutable audit log | Compliance and incident response remain limited. | Observability, org context, event taxonomy. |
| Central notification event bus | Notification behavior may fragment by domain. | Email utilities, user/org preferences. |
| Unified feature flag registry | Feature toggles may mix billing, config and local checks. | Runtime plan config, org config, RBAC. |
| Documented media lifecycle policy | Retention/deletion/scanning not centrally governed. | Media service, storage backend. |

## Backlog priorizado

| Prioridade | Missão sugerida | Objetivo | Risco | Rollback |
|---|---|---|---|---|
| P1 | MISSION-009 — Audit/Webhook Reliability Discovery | Verify webhook delivery runtime, retries and audit/event gaps. | May reveal schema needs. | Documentation-only rollback. |
| P1 | MISSION-010 — Platform Core Security Contract | Define mandatory org/RBAC contract checklist for new routers/services. | Over-constraining domains. | Remove/adjust checklist. |
| P2 | MISSION-011 — Notification Foundation Blueprint | Decide whether email utilities become a notification service. | Premature abstraction. | ADR reversal. |
| P2 | MISSION-012 — Media Lifecycle Blueprint | Document retention, deletion and scanning requirements. | Operational complexity. | Documentation rollback. |
| P3 | MISSION-013 — Feature Gate Registry Blueprint | Normalize billing gates vs feature flags. | Could duplicate existing plan checks. | Documentation rollback. |
