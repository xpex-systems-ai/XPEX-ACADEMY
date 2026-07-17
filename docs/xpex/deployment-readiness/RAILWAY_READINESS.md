# Railway Readiness

## API service

- Root directory: `apps/api` if using service-specific deploy; Dockerfile exists.
- Runtime: Python 3.14.3-slim image with `uv sync --frozen`.
- Start: existing Docker entrypoint.
- Health check: `/api/v1/health`.
- Required secrets/config: JWT secret, SQL connection string, allowed origins, frontend/domain values, and the staging configuration matrix from MISSION-011.

## Collab service

- Deploy separately only if collaborative boards are included in MVP staging.
- Runtime: Node 24 container running `node dist/index.js`.
- Required config: `COLLAB_INTERNAL_KEY`, `LEARNHOUSE_AUTH_JWT_SECRET_KEY`, `LEARNHOUSE_API_URL`, `LEARNHOUSE_REDIS_URL`, `COLLAB_PORT`.
- Collab exposes `/` and `/health` with HTTP 200 JSON; Railway still needs a configured and validated health probe against one of these endpoints.

## API host/port readiness — MISSION-010

The API host/port blocker is technically resolved in code for future Railway staging:

- Railway/provider `PORT` has priority.
- `LEARNHOUSE_PORT` remains supported for compatibility.
- `9000` remains the local/container fallback.
- Uvicorn binds explicitly to `0.0.0.0`; `HOSTNAME` no longer controls the bind address.
- Docker health checks use `127.0.0.1` and the same effective port resolver as startup.

No Railway project, service, database, Redis instance, secret, migration or deploy was created by MISSION-010. Railway provisioning remains blocked by MISSION-011 — Staging Configuration Matrix and later provisioning/deploy missions.

## PostgreSQL and Redis

- PostgreSQL is mandatory for realistic API staging.
- Redis is mandatory for Collab and optional/feature-dependent for API staging. Do not provision it merely because configuration exists; provision when selected staging features require it.
