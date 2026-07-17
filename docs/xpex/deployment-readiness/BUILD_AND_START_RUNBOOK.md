# Build and Start Runbook

## Web (`apps/web`)

- Install: `bun install --frozen-lockfile` evidenced by Dockerfile.
- Build: `bun run build` / package script `next build`.
- Start: package script `next start`; container uses `docker-entrypoint.sh` and Next standalone output.
- Health: `/health` is rewritten by `apps/web/proxy.ts` to `/api/health`, and `apps/web/app/api/health/route.ts` returns JSON 200. Future work is to configure and validate the provider/container probe against this existing endpoint.

## API (`apps/api`)

- Install: `uv sync --frozen` evidenced by Dockerfile.
- Start: Docker entrypoint resolves the effective port as `PORT` > `LEARNHOUSE_PORT` > `9000`, validates it, and starts Uvicorn with explicit `--host 0.0.0.0`; direct Python entrypoint runs `uvicorn.run("app:app", host="0.0.0.0", port=config.port)`.
- Health: Dockerfile runs `./docker-healthcheck.sh`; the script resolves the same effective port and curls `http://127.0.0.1:<effective_port>/api/v1/health`. Router path remains `/api/v1/health`.
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

MISSION-010 selected and implemented Option B. The container startup and health check now share a small resolver with this contract:

1. Use `PORT` when provided by the provider.
2. Otherwise use `LEARNHOUSE_PORT` for LearnHouse compatibility.
3. Otherwise use `9000` for local/container fallback.
4. Reject non-decimal, zero, and out-of-range ports before Uvicorn starts.
5. Bind Uvicorn to `0.0.0.0` and never use `HOSTNAME` as the bind address.

Local validation can be run without PostgreSQL, Redis or external network:

```bash
bash -n apps/api/resolve-container-port.sh apps/api/docker-entrypoint.sh apps/api/docker-healthcheck.sh apps/api/tests/test_container_runtime.sh
bash apps/api/tests/test_container_runtime.sh
```

Next readiness step: MISSION-011 — Staging Configuration Matrix.
