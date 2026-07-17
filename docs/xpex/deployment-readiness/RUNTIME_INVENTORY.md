# Runtime Inventory

| Service | Runtime | Evidence | Directory | Install | Build | Start | Health |
|---|---|---|---|---|---|---|---|
| Web | Next.js on Bun build / Node 24 standalone container | `apps/web/package.json`, `apps/web/Dockerfile` | `apps/web` | `bun install --frozen-lockfile` in Docker; local package manager is Bun-compatible | `bun run build` or `next build` | `bun run start`/`next start`; container entrypoint runs standalone server | `/health` rewrites to `/api/health`; `/api/health` returns JSON 200 |
| API | Python 3.14.3 FastAPI/Uvicorn | `apps/api/pyproject.toml`, `apps/api/Dockerfile`, `apps/api/app.py`, `apps/api/docker-entrypoint.sh` | `apps/api` | `uv sync --frozen` in Docker | No build step beyond dependency sync | `./docker-entrypoint.sh`; direct app uses `uvicorn.run("app:app")` | `GET /api/v1/health`, Docker HEALTHCHECK curls fixed `localhost:9000` |
| Collab | TypeScript Hocuspocus/Yjs on Node 24 container | `apps/collab/package.json`, `apps/collab/Dockerfile`, `apps/collab/src/index.ts` | `apps/collab` | `bun install --frozen-lockfile` for build, `npm install --omit=dev` for runtime image | `bun run build` / `tsc` | `node dist/index.js`; package script `tsx src/index.ts` | `/` and `/health` return HTTP 200 JSON |
| CLI | Node >=18 operational CLI | `apps/cli/package.json`, `apps/cli/README.md` | `apps/cli` | package install from workspace/CLI context | `bun run build` / `tsup` | published `learnhouse` command or `npx learnhouse dev/setup` per README | Not a deployed service |

## Runtime blockers

- API requires a valid `LEARNHOUSE_AUTH_JWT_SECRET_KEY` before config load; boot fails if absent or shorter than 32 characters.
- API health depends on database connectivity because `/api/v1/health` executes `SELECT 1`.
- Collab exits on startup when `LEARNHOUSE_AUTH_JWT_SECRET_KEY` or `COLLAB_INTERNAL_KEY` is missing and assumes Redis URL fallback if not provided.
- Web can build independently, but most authenticated/product flows require a reachable API URL and tenant/domain configuration.

## API Railway port and bind blocker

`apps/api/docker-entrypoint.sh` currently derives the Uvicorn port with `PORT=${LEARNHOUSE_PORT:-9000}` and the bind host with `HOST=${HOSTNAME:-0.0.0.0}`. This means the process does not directly consume a provider-supplied `PORT` variable, `HOSTNAME` can produce a bind target different from `0.0.0.0`, and the Docker health check remains fixed on `localhost:9000`. Until host/port strategy is decided and validated, the API must not be classified as Railway-ready.

Future options without code changes in this mission:

- **Option A:** set `LEARNHOUSE_PORT=9000`, confirm the Railway service routes to port 9000, validate that the process binds on `0.0.0.0`, and keep the health check aligned to port 9000.
- **Option B — recommended:** open a small functional mission to harden the API entrypoint so it binds explicitly to `0.0.0.0`, accepts the provider `PORT` with fallback to `LEARNHOUSE_PORT` and then `9000`, and aligns health-check behavior with the same port strategy.
