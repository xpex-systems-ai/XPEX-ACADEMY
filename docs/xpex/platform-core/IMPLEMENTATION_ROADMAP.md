# Platform Core Implementation Roadmap

| Ordem | Missão | Objetivo | Dependências | Risco | Critérios de aceite | Rollback |
|---|---|---|---|---|---|---|
| 1 | MISSION-009 — Environment and Deployment Readiness Audit | Map runtimes, environment variables, staging topology, health endpoints, database readiness, storage readiness, blockers and explicit absence of deploy/provider mutation. | Current repository manifests, Dockerfiles, entrypoints, config files and deployment documentation. | High if readiness gaps are missed before provisioning. | Documentation-only audit with no deploy, no remote migration, no provider mutation, no secrets and no functional code changes. | Revert deployment-readiness docs and ADR updates. |
| 2 | MISSION-010 — API Container Port and Bind Hardening | Functionally harden the API entrypoint so provider `PORT` is accepted with fallback to `LEARNHOUSE_PORT` and `9000`, bind is explicitly `0.0.0.0`, and health check behavior is aligned to the same strategy. | MISSION-009 API host/port blocker, `apps/api/docker-entrypoint.sh`, API Docker health check and FastAPI health endpoint. | Medium/high: incorrect binding can keep Railway API unreachable even when the process is running. | Code change covered by tests/local container validation; no remote deploy or provider mutation required. | Revert entrypoint/health-check changes from the hardening mission. |
| 3 | MISSION-011 — Staging Configuration Matrix | Approve domains, CORS/cookies, public vs secret env placement and provider ownership before provisioning. | MISSION-009 audit and MISSION-010 port/bind decision. | Medium: wrong domain/cookie/CORS settings can break auth or tenant isolation. | Matrix approved without secrets, deploys or provider mutations. | Revert matrix document. |
| 4 | MISSION-012 — Notification Foundation Blueprint | Decide if email utilities need a central notification/event contract. | Email utilities, auth emails, billing emails. | Medium: risk of over-abstraction. | ADR with included/excluded channels and no implementation. | Revert ADR/docs. |
| 5 | MISSION-013 — Media Lifecycle Blueprint | Define deletion, retention, scanning and signed/share access governance. | Media service, storage config, content routers and MISSION-009 storage findings. | Medium: may require operational dependencies later. | Documented policy and future implementation criteria. | Revert docs. |
| 6 | MISSION-014 — Feature Gate Registry Blueprint | Separate plan gates, org config and real feature flags. | Plans, usage, feature utils. | Low/medium: could duplicate plan checks if poorly scoped. | Registry of gates with owners and no new flags. | Revert docs. |
| 7 | MISSION-015 — Webhook and Audit Reliability Discovery | Map real webhook delivery runtime, retry behavior, event publishers and audit gaps as a separate future discovery mission. | Current webhook DB/router/services and observability docs. | High if it uncovers missing guarantees. | No code changes; documented delivery/audit evidence and ADR recommendation. | Remove docs/ADR from the mission. |
| 8 | MISSION-016 — API Token Governance | Document token rotation, rate limiting and audit requirements. | API token models/services and security docs. | Medium: may identify missing enforcement. | Governance doc and optional ADR only. | Revert docs/ADR. |

## Recomendações

- MISSION-009 is the current documentation-only readiness audit: runtimes, env vars, topology, health, database, storage, blockers and no deploy.
- MISSION-010 should be API Container Port and Bind Hardening before Railway API provisioning.
- Keep staging configuration approval after the API host/port strategy is safe.
- Webhook delivery and audit reliability remain separate future missions and should not be mixed into MISSION-009 or MISSION-010.
- Never combine provider provisioning, schema changes or remote deploys with discovery missions.
