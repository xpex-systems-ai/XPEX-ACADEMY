# XPeX Academy — Current Infrastructure Discovery & State Audit

**Document:** `docs/gxeon/gcp/XPEX_GCP_CURRENT_STATE.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Audit Verified against Codebase (`dev` branch)  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Executive Summary

This document captures the real, verified state of XPeX Academy's infrastructure. In accordance with the GXEON Engineering Manifesto, **code is the single source of truth**. All assumptions are verified against the Dockerfiles, startup scripts, network configurations, database migrations, and service code.

XPeX Academy is currently deployed in production on **Railway** (`resourceful-optimism` project, domain `xpex-academy-ai.up.railway.app`) using a **combined multi-service container** pattern, with preview deployments on **Vercel** (`prj_EvLi9wcPcy2p7op1ChdvI8kPksKV`).

---

## 2. Application Architecture & Runtimes

```
                      INTERNET / USER
                            │
                            ▼
              ┌───────────────────────────┐
              │      RAILWAY INGRESS      │
              │  Port $PORT (default 8080)│
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │      NGINX (Reverse Proxy)│
              │   /etc/nginx/conf.d/      │
              └──────┬──────┬──────┬──────┘
                     │      │      │
       ┌─────────────┘      │      └──────────────┐
       ▼                    ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│ Next.js Web  │    │  FastAPI API │      │ Collab Node  │
│ Port 8000    │    │  Port 9000   │      │ Port 4000    │
│ Node 22 / PM2│    │ Python 3.14  │      │ Bun / PM2    │
│ (Next.js 16) │    │ (Uvicorn)    │      │ (Hocuspocus) │
└──────────────┘    └──────┬───────┘      └──────┬───────┘
                           │                     │
                     ┌─────┴──────┐        ┌─────┴──────┐
                     ▼            ▼        ▼            ▼
              ┌───────────┐  ┌───────────┐┌───────────┐ ┌───────────┐
              │PostgreSQL │  │   Redis   ││   Redis   │ │Local Disk │
              │(pgvector) │  │  (Cache)  ││ (Yjs Doc) │ │/data/xpex-│
              └───────────┘  └───────────┘└───────────┘ │   media   │
                                                        └───────────┘
```

### Component Details:
1. **Frontend (`apps/web`)**:
   - Framework: Next.js 16.2.9, React 19.2.7, TypeScript.
   - Build Tool: Bun (`oven/bun:1-alpine`), standalone output mode (`.next/standalone`).
   - Production Runner: Node.js 22 (via PM2 in combined container or `node:24-alpine` standalone).
   - Wrapper: `server-wrapper.js` (injects runtime environment variables into Next.js).
   - Public port: 8000 internally.
   - Vercel footprint: `vercel.json` and `apps/web/vercel.json` exist for preview deployments.

2. **Backend API (`apps/api`)**:
   - Framework: FastAPI 0.137.2, Uvicorn 0.49.0, Python 3.14.3 (`python:3.14.3-slim-bookworm`).
   - Dependency Manager: `uv` (Fast Python package manager, `uv.lock`, `pyproject.toml`).
   - Core libraries: SQLModel 0.0.38, SQLAlchemy, asyncpg 0.31.0, psycopg2-binary, Pydantic AI, pgvector 0.4.2, PyJWT, Cryptography.
   - Entrypoint: `uvicorn app:app` or `uv run app.py` (listens on internal port 9000).
   - Healthcheck: `GET /api/v1/health` (verifies DB + Redis connection).

3. **Collaboration Service (`apps/collab`)**:
   - Runtime: Node.js / Bun (`tsx`, `@hocuspocus/server` 4.0.0, `@hocuspocus/extension-database`, `yjs` 13.6.20, `ioredis` 5.9.3).
   - Protocol: WebSocket (`ws://` / `wss://`).
   - Entrypoint: `node dist/index.js` (listens on internal port 4000).
   - Nginx Route: `/collab` with `Upgrade $http_upgrade` and `proxy_read_timeout 86400s`.

4. **Reverse Proxy & Process Supervisor**:
   - Reverse Proxy: **Nginx** (binds to external `$PORT`, default 8080/80).
   - Config generator: `docker/render-nginx-config.sh` dynamically replaces port bindings at boot.
   - Supervisor: **PM2** (`pm2 start server-wrapper.js`, `pm2 start uv run app.py`, `pm2 start node dist/index.js`).
   - Startup Script: `docker/start.sh` orchestrates database readiness, schema preflights, startup scripts, PM2 start, and Nginx background launch.

---

## 3. Data & State Storage Analysis

### 3.1 PostgreSQL (Relational Data)
- **Current Host**: Railway managed PostgreSQL instance.
- **Connection Variable**: `LEARNHOUSE_SQL_CONNECTION_STRING` (format: `postgresql+asyncpg://user:pass@host:port/dbname`).
- **Extensions**:
  - `pgvector`: Required for AI embeddings, RAG vectors (`Vector(768)` in `src/db/course_embeddings.py`).
  - Standard PostgreSQL extensions (uuid-ossp, pgcrypto).
- **Migration Framework**: Alembic (`apps/api/migrations`), plus guarded preflight script `scripts/xpex_assessment_schema_ready.py` executed at boot in `docker/start.sh`.

### 3.2 Redis (In-Memory Data)
- **Current Host**: Railway managed Redis instance.
- **Connection Variable**: `LEARNHOUSE_REDIS_CONNECTION_STRING` and `LEARNHOUSE_REDIS_URL`.
- **Usage Audit**:
  1. *Session & Token Revocation*: `jwt_revoked_before:{user_id}`, `refresh_used:{user_id}:{jti}`, `refresh_grace:{user_id}:{jti}` in `src/security/auth.py`.
  2. *Collaboration Document Cache*: Yjs document buffer state (`@hocuspocus/server` cache, TTL 3600s).
  3. *AI Generation History & Context*: Transient conversation context in `src/services/ai/base.py`.
  4. *Rate Limiting*: API token and route rate limiting.
- **Transient vs Durable**: Redis is strictly used as a cache, token revocation blocklist, and ephemeral coordination layer. Loss of Redis during cold cutover forces users to re-login, but causes zero database loss.

### 3.3 Media & File Storage (Durable vs Ephemeral Risk)
- **Current Mode**: Dual configuration in `apps/api/config/config.py`:
  - `LEARNHOUSE_CONTENT_DELIVERY_TYPE=filesystem` (default fallback).
  - `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api` (supported via `boto3` in `src/services/courses/transfer/storage_utils.py`).
- **Current Railway Persistence**: Mounts `/data/xpex-media` via `XPEX_DURABLE_MEDIA_ROOT`.
- **CRITICAL CLOUD RUN FINDING**:
  - Container disk in Cloud Run is strictly in-memory or ephemeral. Writing to local disk in Cloud Run causes memory consumption and data loss on revision shutdown/scaling.
  - **Requirement**: `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api` MUST be activated with Google Cloud Storage (S3-compatible interoperability API or GCS client) prior to cutover.

---

## 4. XPeX AI & Video Processing Pipeline

### 4.1 Synchronous AI Layer (GXEON AI Gateway)
- Implemented in `apps/api/src/services/xpex/ai_gateway.py`.
- Sits on top of provider abstraction (`apps/api/src/services/ai/llm/provider.py`) built on Pydantic AI.
- Central model routing via `apps/api/src/services/ai/llm/tiers.py` (`fast`, `standard`, `pro`).
- Providers supported: Google/Gemini, OpenRouter, Anthropic, OpenAI, DeepSeek, Moonshot, Mistral, Bedrock, Ollama.
- Health endpoint: `GET /api/v1/xpex/ai-gateway/health` (requires authenticated user, reports readiness safely without calling live paid APIs).

### 4.2 Asynchronous Video Lesson Factory
- Managed via `apps/api/src/services/xpex/video_jobs.py` and `video_worker.py`.
- Architecture:
  - Jobs are persisted in database table `xpex_video_jobs` (`XPeXVideoJob`).
  - Workers use `FOR UPDATE SKIP LOCKED` to claim jobs safely across replicas.
  - State machine: `SCRIPTING` → `STORYBOARDING` → `NARRATING` → `ASSET_GENERATION` → `RENDERING` → `REVIEWING` → `AWAITING_HUMAN_APPROVAL`.
  - **Human Review Gate**: Jobs deliberately freeze at `AWAITING_HUMAN_APPROVAL`. No automated publishing without human signoff.
  - Heavy processes: `ffmpeg` video stitching/transcoding, `edge-tts` / neural voice synthesis, Hugging Face multimodal review.
- **CRITICAL CLOUD RUN FINDING**:
  - Heavy `ffmpeg` render batches MUST NOT run in synchronous web HTTP request lifecycles (Cloud Run request timeout is max 60 min, default 5 min; CPU is throttled outside requests unless CPU is always allocated).
  - Target: Decouple video rendering into **Cloud Run Jobs** or dedicated asynchronous worker tasks triggered via Cloud Tasks / Pub/Sub.

---

## 5. Network, Domain & Security Audit

### 5.1 Ports & Routing
| Port | Process | Role | Public? |
|---|---|---|---|
| `$PORT` (80/8080) | Nginx | Reverse proxy & SSL termination point | Yes (Only public port) |
| `8000` | Next.js (`server-wrapper.js`) | Frontend SSR / Static pages / Auth | No (Internal to container) |
| `9000` | FastAPI (`uv run app.py`) | Backend API (`/api/v1`, `/content`, `/api/webhooks`) | No (Internal to container) |
| `4000` | Node.js (`dist/index.js`) | Yjs / Hocuspocus WebSockets (`/collab`) | No (Internal to container) |

### 5.2 Domains & CORS
- Production domain: `xpex-academy-ai.up.railway.app`.
- Custom domain mapping: Supported in LearnHouse (`LEARNHOUSE_DOMAIN`, `LEARNHOUSE_FRONTEND_DOMAIN`).
- Allowed origins: `LEARNHOUSE_ALLOWED_ORIGINS` (comma-separated list of trusted browser origins).
- Cookie configuration:
  - Access token: `LH_access` (JWT, 8h TTL, SameSite=Lax, Secure=True).
  - Refresh token: `LH_refresh` (JWT, 30d TTL, SameSite=Lax, Secure=True).
  - Domain: `LEARNHOUSE_COOKIE_DOMAIN` (guarded against overly broad parent domains).

---

## 6. Railway Specific Artifacts & Dependencies

1. **Build Mechanism**: Railway uses root `Dockerfile` (multi-stage build with Bun, Node, Python, Nginx, PM2).
2. **Environment Variable Injection**: Injected by Railway dashboard directly into container runtime.
3. **Volume Mount**: `/data/xpex-media` configured in Railway dashboard.
4. **Railway Plugins**:
   - `Railway PostgreSQL` (Postgres 16+ with pgvector).
   - `Railway Redis` (Redis 7+).
5. **Pre-deploy Scripts**: Handled in `docker/start.sh` before PM2 daemonizes.

---

## 7. Current Infrastructure Risk Summary

| Category | Finding | Impact on GCP Migration |
|---|---|---|
| **Container Architecture** | Monolithic combined container (Nginx + PM2 + Next + FastAPI + Node Collab) | Runs on Cloud Run as-is, but decoupling API and Web enables independent scaling and cost optimization |
| **Filesystem State** | Local storage assumes `/data/xpex-media` | Must migrate to Google Cloud Storage (`LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api`) |
| **Video Rendering** | Render pipeline runs on container host with `ffmpeg` | Needs Cloud Run Jobs or dedicated worker with Cloud Storage integration |
| **WebSockets** | `/collab` requires long-lived WebSocket connections | Supported by Cloud Run (up to 60 min session timeout with HTTP/2 and WebSockets enabled) |
| **Database Extensions** | Relies on `pgvector` for course embeddings | Cloud SQL for PostgreSQL natively supports `vector` extension |
| **Secrets Management** | Flat env vars in Railway dashboard | Transition to Google Secret Manager with least-privilege service account |
