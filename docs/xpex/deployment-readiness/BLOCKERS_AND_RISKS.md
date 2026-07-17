# Blockers and Risks

| Severity | Item | Impact | Resolution mission |
|---|---|---|---|
| P0 | No approved staging secrets/provider resources | Official pilot deploy cannot start | MISSION-010 provision secrets/resource plan |
| P0 | Database not provisioned/migration path not approved | API health and persistence unavailable | MISSION-010/011 DB provisioning and migration rehearsal |
| P1 | Storage backend not selected for staging | Media may be lost on ephemeral filesystem | MISSION-012 storage provisioning |
| P1 | Domain/CORS/cookie matrix undecided | Auth and multi-tenancy may fail or leak | MISSION-010 topology configuration |
| P1 | Collab requiredness not decided | Boards/collaboration may be broken if omitted | MISSION-013 Collab decision |
| P2 | Web and Collab lack dedicated health endpoints | Provider health monitoring less precise | Future implementation mission |
| P2 | Observability projects not configured | Limited incident visibility | Observability provisioning mission |
| P3 | CLI remains self-host/dev oriented | Not a staging blocker | Document after deploy mode chosen |

No deploy was executed and no provider state was mutated.
