# Blockers and Risks

| Severity | Item | Impact | Resolution mission |
|---|---|---|---|
| P0 | No approved staging secrets/provider resources | Official pilot deploy cannot start | MISSION-011 configuration/resource plan |
| P0 | Database not provisioned/migration path not approved | API health and persistence unavailable | MISSION-011/012 DB provisioning and migration rehearsal |
| P1 | Storage backend not selected for staging | Media may be lost on ephemeral filesystem | MISSION-013 storage provisioning |
| P1 | API container host/port strategy undecided | Railway may route to a different port than Uvicorn or the process may bind away from `0.0.0.0`; health check remains fixed on 9000 | MISSION-010 API Container Port and Bind Hardening |
| P1 | Domain/CORS/cookie matrix undecided | Auth and multi-tenancy may fail or leak | MISSION-011 topology configuration |
| P1 | Collab requiredness not decided | Boards/collaboration may be broken if omitted | MISSION-014 Collab decision |
| P2 | Web and Collab lack dedicated health endpoints | Provider health monitoring less precise | Future implementation mission |
| P2 | Observability projects not configured | Limited incident visibility | Observability provisioning mission |
| P3 | CLI remains self-host/dev oriented | Not a staging blocker | Document after deploy mode chosen |

No deploy was executed and no provider state was mutated.
