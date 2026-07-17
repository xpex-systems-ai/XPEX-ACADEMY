# Blockers and Risks

| Severity | Item | Impact | Resolution mission |
|---|---|---|---|
| P0 | No approved staging secrets/provider resources | Official pilot deploy cannot start | MISSION-011 configuration/resource plan |
| P0 | Database not provisioned/migration path not approved | API health and persistence unavailable | MISSION-011/012 DB provisioning and migration rehearsal |
| P1 | Storage backend not selected for staging | Media may be lost on ephemeral filesystem | MISSION-013 storage provisioning |
| Resolved by code | API container host/port strategy hardened | MISSION-010 now uses `PORT` > `LEARNHOUSE_PORT` > `9000`, explicit Uvicorn bind `0.0.0.0`, and health checks on `127.0.0.1:<effective_port>/api/v1/health`; provider staging is still not provisioned | Validate during MISSION-011+ staging configuration/deploy |
| P1 | Domain/CORS/cookie matrix undecided | Auth and multi-tenancy may fail or leak | MISSION-011 topology configuration |
| P1 | Collab requiredness not decided | Boards/collaboration may be broken if omitted | MISSION-014 Collab decision |
| P3 | Provider health probes not configured or validated | Existing Web `/health` and Collab `/health` endpoints need provider/container probe configuration and validation | Deployment validation mission |
| P2 | Observability projects not configured | Limited incident visibility | Observability provisioning mission |
| P3 | CLI remains self-host/dev oriented | Not a staging blocker | Document after deploy mode chosen |

No deploy was executed and no provider state was mutated.
