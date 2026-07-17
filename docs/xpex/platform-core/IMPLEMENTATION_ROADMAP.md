# Platform Core Implementation Roadmap

| Ordem | Missão | Objetivo | Dependências | Risco | Critérios de aceite | Rollback |
|---|---|---|---|---|---|---|
| 1 | MISSION-009 — Environment and Deployment Readiness Audit | Map deployment readiness, runtimes, env vars, topology and blockers before provider provisioning. | Current webhook DB/router/services and observability docs. | High if it uncovers missing guarantees. | No code changes; documented delivery/audit evidence and ADR recommendation. | Remove docs/ADR from the mission. |
| 2 | MISSION-010 — Staging Configuration Matrix | Approve domains, CORS/cookies, secret ownership and provider provisioning plan before deploy. | This registry, RBAC helpers, org_auth. | Medium: may require future validator scope. | Checklist references real helpers and prohibits parallel authz. | Revert checklist. |
| 3 | MISSION-011 — Notification Foundation Blueprint | Decide if email utilities need a central notification/event contract. | Email utilities, auth emails, billing emails. | Medium: risk of over-abstraction. | ADR with included/excluded channels and no implementation. | Revert ADR/docs. |
| 4 | MISSION-012 — Media Lifecycle Blueprint | Define deletion, retention, scanning and signed/share access governance. | Media service, storage config, content routers. | Medium: may require operational dependencies later. | Documented policy and future implementation criteria. | Revert docs. |
| 5 | MISSION-013 — Feature Gate Registry Blueprint | Separate plan gates, org config and real feature flags. | Plans, usage, feature utils. | Low/medium: could duplicate plan checks if poorly scoped. | Registry of gates with owners and no new flags. | Revert docs. |
| 6 | MISSION-014 — API Token Governance | Document token rotation, rate limiting and audit requirements. | API token models/services and security docs. | Medium: may identify missing enforcement. | Governance doc and optional ADR only. | Revert docs/ADR. |

## Recomendações

- Keep each roadmap step documentation-first until evidence requires code.
- Never combine schema changes with discovery missions.
- Any future implementation must include tests and rollback criteria specific to the changed capability.
- MISSION-009 should be next because webhooks and audit are the least certain shared core capabilities and affect integrations, compliance and future Marketplace/Studio automations.
