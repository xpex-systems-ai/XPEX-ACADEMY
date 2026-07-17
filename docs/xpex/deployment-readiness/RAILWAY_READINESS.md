# Railway Readiness

## API service

- Root directory: `apps/api` if using service-specific deploy; Dockerfile exists.
- Runtime: Python 3.14.3-slim image with `uv sync --frozen`.
- Start: existing Docker entrypoint.
- Health check: `/api/v1/health`.
- Required secrets/config: JWT secret, SQL connection string, allowed origins, frontend/domain values, and an approved host/port binding strategy.

## Collab service

- Deploy separately only if collaborative boards are included in MVP staging.
- Runtime: Node 24 container running `node dist/index.js`.
- Required config: `COLLAB_INTERNAL_KEY`, `LEARNHOUSE_AUTH_JWT_SECRET_KEY`, `LEARNHOUSE_API_URL`, `LEARNHOUSE_REDIS_URL`, `COLLAB_PORT`.
- Collab exposes `/` and `/health` with HTTP 200 JSON; Railway still needs a configured and validated health probe against one of these endpoints.

## API host/port blocker

The API is **not yet Railway-ready** because `apps/api/docker-entrypoint.sh` reads `LEARNHOUSE_PORT` with fallback to `9000`, does not directly consume the provider `PORT`, reads `HOSTNAME` before falling back to `0.0.0.0`, and the Docker health check curls fixed `localhost:9000`. Railway provisioning must wait until Option A is manually validated or Option B hardens the entrypoint in a future functional mission.

Future options:

- **Option A:** set `LEARNHOUSE_PORT=9000`, confirm Railway routes to 9000, validate bind on `0.0.0.0`, and keep the health check aligned.
- **Option B — recommended:** open `API Container Port and Bind Hardening` to bind explicitly to `0.0.0.0`, consume provider `PORT` with fallback to `LEARNHOUSE_PORT` and `9000`, and align health checks to the same strategy.

## PostgreSQL and Redis

- PostgreSQL is mandatory for realistic API staging.
- Redis is mandatory for Collab and optional/feature-dependent for API staging. Do not provision it merely because configuration exists; provision when selected staging features require it.
