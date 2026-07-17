# Build and Start Runbook

## Web (`apps/web`)

- Install: `bun install --frozen-lockfile` evidenced by Dockerfile.
- Build: `bun run build` / package script `next build`.
- Start: package script `next start`; container uses `docker-entrypoint.sh` and Next standalone output.
- Health: no dedicated health endpoint evidenced.

## API (`apps/api`)

- Install: `uv sync --frozen` evidenced by Dockerfile.
- Start: Docker entrypoint starts the FastAPI application; direct Python entrypoint runs `uvicorn.run("app:app", host="0.0.0.0", port=config.port)`.
- Health: `curl -f http://localhost:9000/api/v1/health` in Dockerfile; router path is `/api/v1/health`.
- Migration command evidence: Alembic is configured by `apps/api/alembic.ini`; remote migrations were not executed.

## Collab (`apps/collab`)

- Install: Docker build uses `bun install --frozen-lockfile`; runtime image uses `npm install --omit=dev`.
- Build: `bun run build` / `tsc`.
- Start: container command `node dist/index.js`; package script `tsx src/index.ts` for direct start.
- Health: no dedicated health endpoint evidenced.

## CLI (`apps/cli`)

- Build: `bun run build` / `tsup`.
- Operational docs/root README reference `npx learnhouse dev` and `npx learnhouse@latest setup` for local/self-hosted flows.
