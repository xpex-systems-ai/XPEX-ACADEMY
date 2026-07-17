# Railway Readiness

## API service

- Root directory: `apps/api` if using service-specific deploy; Dockerfile exists.
- Runtime: Python 3.14.3-slim image with `uv sync --frozen`.
- Start: existing Docker entrypoint.
- Health check: `/api/v1/health`.
- Required secrets/config: JWT secret, SQL connection string, allowed origins, frontend/domain values, port binding.

## Collab service

- Deploy separately only if collaborative boards are included in MVP staging.
- Runtime: Node 24 container running `node dist/index.js`.
- Required config: `COLLAB_INTERNAL_KEY`, `LEARNHOUSE_AUTH_JWT_SECRET_KEY`, `LEARNHOUSE_API_URL`, `LEARNHOUSE_REDIS_URL`, `COLLAB_PORT`.
- No dedicated health endpoint was found; Railway health policy needs a process-level check or future endpoint.

## PostgreSQL and Redis

- PostgreSQL is mandatory for realistic API staging.
- Redis is mandatory for Collab and optional/feature-dependent for API staging. Do not provision it merely because configuration exists; provision when selected staging features require it.
