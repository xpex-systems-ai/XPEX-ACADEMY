# Runtime Inventory

| Service | Runtime | Evidence | Directory | Install | Build | Start | Health |
|---|---|---|---|---|---|---|---|
| Web | Next.js on Bun build / Node 24 standalone container | `apps/web/package.json`, `apps/web/Dockerfile` | `apps/web` | `bun install --frozen-lockfile` in Docker; local package manager is Bun-compatible | `bun run build` or `next build` | `bun run start`/`next start`; container entrypoint runs standalone server | `/health` rewrites to `/api/health`; `/api/health` returns JSON 200 |
| API | Python 3.14.3 FastAPI/Uvicorn | `apps/api/pyproject.toml`, `apps/api/Dockerfile`, `apps/api/app.py`, `apps/api/docker-entrypoint.sh` | `apps/api` | `uv sync --frozen` in Docker | No build step beyond dependency sync | `./docker-entrypoint.sh`; direct app uses `uvicorn.run("app:app")` | `GET /api/v1/health`, Docker HEALTHCHECK runs `./docker-healthcheck.sh` against `127.0.0.1:<effective_port>` |
| Collab | TypeScript Hocuspocus/Yjs on Node 24 container | `apps/collab/package.json`, `apps/collab/Dockerfile`, `apps/collab/src/index.ts` | `apps/collab` | `bun install --frozen-lockfile` for build, `npm install --omit=dev` for runtime image | `bun run build` / `tsc` | `node dist/index.js`; package script `tsx src/index.ts` | `/` and `/health` return HTTP 200 JSON |
| CLI | Node >=18 operational CLI | `apps/cli/package.json`, `apps/cli/README.md` | `apps/cli` | package install from workspace/CLI context | `bun run build` / `tsup` | published `learnhouse` command or `npx learnhouse dev/setup` per README | Not a deployed service |

## Runtime blockers

- API requires a valid `LEARNHOUSE_AUTH_JWT_SECRET_KEY` before config load; boot fails if absent or shorter than 32 characters.
- API health depends on database connectivity because `/api/v1/health` executes `SELECT 1`.
- Collab exits on startup when `LEARNHOUSE_AUTH_JWT_SECRET_KEY` or `COLLAB_INTERNAL_KEY` is missing and assumes Redis URL fallback if not provided.
- Web can build independently, but most authenticated/product flows require a reachable API URL and tenant/domain configuration.

## API Railway port and bind hardening — MISSION-010

MISSION-010 resolves the technical API host/port blocker in code. The previous container contract derived the Uvicorn port from `LEARNHOUSE_PORT` with fallback `9000`, allowed `HOSTNAME` to influence the bind host, and used a Docker health check fixed to `localhost:9000`.

The hardened contract is now:

- Effective port precedence: `PORT` > `LEARNHOUSE_PORT` > `9000`.
- Port validation: decimal integer only, range `1..65535`, fail-fast before Uvicorn when invalid.
- Uvicorn bind: explicit `0.0.0.0`; `HOSTNAME` is ignored for server binding.
- Health check: `docker-healthcheck.sh` reuses the same resolver and probes `http://127.0.0.1:<effective_port>/api/v1/health`.

Railway staging is still not provisioned by this mission. Remaining readiness work moves to MISSION-011 — Staging Configuration Matrix for provider resources, secrets, topology, CORS/cookie/domain values, database and Redis decisions.
