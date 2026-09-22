# XPeX Academy — Service Inventory & GCP Target Mapping

**Document:** `docs/gxeon/gcp/XPEX_GCP_SERVICE_MAPPING.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Exhaustive Service Mapping  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Comprehensive Service Inventory Table

The following inventory maps every real workload, data store, process, and integration running in XPeX Academy from its current Railway PaaS deployment to its designated target service in Google Cloud Platform.

| Service / Workload | Current Host | Current Entrypoint | Port | Stateful? | Database? | Redis? | Storage? | Public? | Healthcheck? | Target GCP Service |
|---|---|---|---|---|---|---|---|---|---|---|
| **Backend API** | Railway PaaS (Combined Container) | `uv run app.py` (via PM2) | 9000 (Internal) | No (Stateless) | Yes (SQLModel / asyncpg) | Yes (Token revocation & cache) | Yes (Uploads via S3 API) | Yes (via Nginx `/api/v1`) | `GET /api/v1/health` | **Cloud Run (`xpex-api`)** |
| **Frontend Web** | Railway PaaS (Combined Container) / Vercel (Previews) | `node server-wrapper.js` | 8000 (Internal) | No (Stateless) | No (Calls API) | No | No | Yes (via Nginx `/`) | `GET /` (HTTP 200) | **Cloud Run (`xpex-web`)** (Prod) / Vercel (Previews) |
| **Collab Server** | Railway PaaS (Combined Container) | `node dist/index.js` (Bun/Hocuspocus) | 4000 (Internal) | Ephemeral (Yjs doc cache in Redis) | Yes (persists ydocs to PostgreSQL) | Yes (Redis cache, TTL 3600s) | No | Yes (via Nginx `/collab` WSS) | WS handshake on `/collab` | **Cloud Run (`xpex-collab`)** (WebSockets enabled) |
| **Reverse Proxy** | Railway PaaS (Combined Container) | `nginx -g 'daemon off;'` | `$PORT` (8080/80) | No (Stateless) | No | No | No | Yes | Nginx master process | **Cloud Run Service Ingress** + **Cloud Load Balancing** |
| **Process Supervisor** | Railway PaaS (Combined Container) | `pm2 start ...` / `docker/start.sh` | N/A | No | No | No | No | No | `pm2 status` | **Cloud Run Native Process Management** |
| **Relational Database** | Railway Managed PostgreSQL | PostgreSQL 16 server | 5432 | Yes (Durable DB) | Self | No | Local Volume | No (Private network) | `pg_isready` | **Cloud SQL for PostgreSQL 16 (pgvector enabled)** |
| **In-Memory Cache & Blocklist** | Railway Managed Redis | Redis 7.2 server | 6379 | Ephemeral | No | Self | No | No (Private network) | `redis-cli ping` | **Memorystore for Redis (7.2)** |
| **Media & Assets Storage** | Railway Disk Volume (`/data/xpex-media`) | Filesystem local mount | N/A | Yes (Durable Files) | Metadata in DB | No | Local disk | No (Direct), Yes (via API) | OS stat check | **Google Cloud Storage (GCS)** (`xpex-media-prod-sa1`) |
| **Video Job Worker / Renderer** | Background thread in Railway container (`scripts/xpex_course001_video_canary.py`) | Background shell execution in `docker/start.sh` | N/A | No (Claims rows from DB) | Yes (`xpex_video_jobs`) | No | Writes to S3/GCS | No | Lease heartbeat in DB | **Cloud Run Jobs** (triggered by **Cloud Tasks**) |
| **Assessment Schema Preflight** | Boot command in `docker/start.sh` | `python scripts/xpex_assessment_schema_ready.py` | N/A | No | Yes (Executes DDL repair) | No | No | No | Exit code 0 | **Cloud Run Job / Cloud Build Pre-Deploy Step** |
| **Secrets Management** | Railway Environment Variables | Dashboard key-value injection | N/A | No | No | No | No | No | N/A | **Google Secret Manager** |
| **Container Registry** | Railway Internal Builder | `docker build` (multi-stage) | N/A | No | No | No | No | No | N/A | **Artifact Registry** (`southamerica-east1-docker.pkg.dev`) |
| **CI / CD Pipeline** | GitHub Actions (`staging.yml`, `api-tests.yaml`) | GitHub runner | N/A | No | No | No | No | No | CI workflow exit code | **Cloud Build / Developer Connect** + GitHub Actions |
| **Logging & Telemetry** | Railway Log Stream (`pm2 logs --raw`) | Stdout / Stderr | N/A | No | No | No | No | No | N/A | **Cloud Logging** + **Cloud Monitoring** |

---

## 2. Component Analysis & Porting Constraints

### 2.1 Backend API (`xpex-api`)
- **Container Port Requirement**: Must listen on the port specified by `$PORT` (Cloud Run injects `PORT=8080`).
- **Code Audit**: In `apps/api/config/config.py`:
  ```python
  port = env_port or yaml_config.get("hosting_config", {}).get("port")
  ```
  And in `apps/api/app.py`:
  ```python
  port=learnhouse_config.hosting_config.port
  ```
  `apps/api/Dockerfile` entrypoint already uses `--port ${PORT:-9000}` and binds to `0.0.0.0`.
- **Statelessness**: Zero files written to local disk when `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api` is configured.
- **Startup Latency**: ~3-5 seconds. Well within Cloud Run's 240s startup probe limit.

### 2.2 Frontend Web (`xpex-web`)
- **Next.js Standalone**: Output mode `.next/standalone` bundles all dependencies into a minimal production Node server.
- **Port Requirement**: Listens on `$PORT` (3000 in standalone Dockerfile, 8000 in combined container).
- **Runtime Configuration**: `server-wrapper.js` reads client-side public environment variables at container boot and injects them into `runtime-config.json`. Completely compatible with Cloud Run.

### 2.3 Collaboration Server (`xpex-collab`)
- **WebSocket Protocol**: Cloud Run natively supports WebSockets over HTTP/1.1 and HTTP/2.
- **Connection Duration**: Cloud Run supports up to 60-minute request timeouts (`--timeout=3600s`).
- **Session Affinity**: Enabled on Cloud Run to ensure WebSockets from the same browser document connect to the same container instance.
- **State Buffer**: In-memory Yjs updates are flushed to Redis every 5,000ms (`DB_FLUSH_DELAY = 5000`) and persisted into PostgreSQL.

### 2.4 Asynchronous Video Engine (`xpex-video-render`)
- **Heavy Dependencies**: `ffmpeg`, `edge-tts`, `fonts-dejavu-core`, `Pillow`.
- **Execution Model**: The current architecture claims rows using `FOR UPDATE SKIP LOCKED` on the `xpex_video_jobs` table.
- **Target GCP Solution**:
  - Deploy a containerized **Cloud Run Job** (`xpex-video-worker`).
  - Executed on-demand via Cloud Tasks or a Cloud Scheduler cron loop (e.g. every 2 minutes while active batches exist).
  - Maximum duration: Up to 24 hours per task execution.
  - Auto-terminates when the job queue is drained, dropping idle cost to $0.
