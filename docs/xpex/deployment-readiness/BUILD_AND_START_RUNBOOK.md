# Build and Start Runbook

## Web (`apps/web`)

- Install: `bun install --frozen-lockfile` evidenced by Dockerfile.
- Build: `bun run build` / package script `next build`.
- Start: package script `next start`; container uses `docker-entrypoint.sh` and Next standalone output.
- Health: `/health` is rewritten by `apps/web/proxy.ts` to `/api/health`, and `apps/web/app/api/health/route.ts` returns JSON 200. Future work is to configure and validate the provider/container probe against this existing endpoint.

## API (`apps/api`)

- Install: `uv sync --frozen` evidenced by Dockerfile.
- Start: Docker entrypoint starts Uvicorn with `PORT=${LEARNHOUSE_PORT:-9000}` and `HOST=${HOSTNAME:-0.0.0.0}`; direct Python entrypoint runs `uvicorn.run("app:app", host="0.0.0.0", port=config.port)`.
- Health: `curl -f http://localhost:9000/api/v1/health` in Dockerfile; router path is `/api/v1/health`. The health check is fixed to port 9000 and is not automatically aligned with a provider `PORT`.
- Migration command evidence: Alembic is configured by `apps/api/alembic.ini`; remote migrations were not executed.

## Collab (`apps/collab`)

- Install: Docker build uses `bun install --frozen-lockfile`; runtime image uses `npm install --omit=dev`.
- Build: `bun run build` / `tsc`.
- Start: container command `node dist/index.js`; package script `tsx src/index.ts` for direct start.
- Health: `/` and `/health` return HTTP 200 JSON in `apps/collab/src/index.ts`. Future work is to configure and validate the Railway health check against this existing endpoint.

## CLI (`apps/cli`)

- Build: `bun run build` / `tsup`.
- Operational docs/root README reference `npx learnhouse dev` and `npx learnhouse@latest setup` for local/self-hosted flows.

### API host/port readiness decision

The API runbook is blocked for Railway until one of these future paths is approved:

- **Option A:** keep the current entrypoint contract, set `LEARNHOUSE_PORT=9000`, configure Railway routing for port 9000, validate bind behavior on `0.0.0.0`, and keep health check expectations on `localhost:9000`.
- **Option B — recommended:** create a functional hardening mission that changes the entrypoint to use explicit host `0.0.0.0`, consume provider `PORT` with fallback to `LEARNHOUSE_PORT` and `9000`, and align the health check with that same strategy.
