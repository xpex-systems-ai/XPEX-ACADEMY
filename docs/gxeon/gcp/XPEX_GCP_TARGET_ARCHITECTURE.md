# XPeX Academy — Target Google Cloud Platform Architecture

**Document:** `docs/gxeon/gcp/XPEX_GCP_TARGET_ARCHITECTURE.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Architecture Blueprint  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Vision & Architectural Principles

The target Google Cloud Platform (GCP) architecture modernizes XPeX Academy from an all-in-one PaaS container into a cloud-native, resilient, and horizontally scalable platform.

### Core Principles:
1. **Preserve before Migrating**: Railway remains 100% operational as rollback and audit reference until GCP reaches verified parity.
2. **Stateless Compute**: Workloads on Cloud Run must maintain zero local filesystem dependencies.
3. **Provider-Neutral Intelligence**: GXEON AI Gateway abstracts all LLM interactions; Gemini and Vertex AI operate behind existing service contracts.
4. **Least Privilege**: Workloads run under dedicated Service Accounts with bounded IAM roles and no static root credentials.
5. **Human-in-the-Loop Media**: Video generation continues through asynchronous jobs with mandatory human review gates before publication.

---

## 2. Target GCP Architecture Diagram

```
                               GITHUB REPOSITORY
                             xpex-systems-ai/XPEX-ACADEMY
                                         │
                                         ▼
                            CLOUD BUILD / DEVELOPER CONNECT
                                (Automated CI Pipeline)
                                         │
                                         ▼
                                ARTIFACT REGISTRY
                         southamerica-east1-docker.pkg.dev
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
                   ▼                                           ▼
      ┌─────────────────────────┐                 ┌─────────────────────────┐
      │  CLOUD RUN: xpex-web    │                 │  CLOUD RUN: xpex-api    │
      │  Next.js 16 (Port 8080) │◄───────────────►│  FastAPI (Port 8080)    │
      │  Min: 1 | Max: 10       │ (Internal/Proxy)│  Min: 1 | Max: 15       │
      └────────────┬────────────┘                 └────────────┬────────────┘
                   │                                           │
                   │ WebSockets                                │
                   ▼                                           │
      ┌─────────────────────────┐                              │
      │  CLOUD RUN: xpex-collab │                              │
      │  Hocuspocus (Port 8080) │                              │
      │  WebSockets Enabled     │                              │
      └────────────┬────────────┘                              │
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         │
                                         ▼
                            SERVERLESS VPC CONNECTOR
                                (Private Subnet)
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │  CLOUD SQL POSTGRES │ │   MEMORYSTORE REDIS │ │ GOOGLE SECRET MGR   │
      │  PostgreSQL 16      │ │   Redis 7.2         │ │ JWT, API Keys, DB   │
      │  pgvector enabled   │ │   Token Blocklist & │ │ Credentials         │
      │  Private IP         │ │   Collab State      │ │ Auto-injected       │
      └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                 ▲
                 │ Asynchronous Events
                 ▼
      ┌─────────────────────┐       ┌─────────────────────┐
      │     CLOUD TASKS     │──────►│   CLOUD RUN JOBS    │
      │   Task Queue for    │       │  ffmpeg Video Render│
      │   Media Workflows   │       │  Worker Execution   │
      └─────────────────────┘       └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ CLOUD STORAGE (GCS) │
                                    │ Bucket: xpex-media  │
                                    │ Transcoded Lessons, │
                                    │ Captions & Audios   │
                                    └─────────────────────┘
```

---

## 3. Region Strategy: `southamerica-east1` (São Paulo)

### 3.1 Primary Region Rationale
The primary regional candidate for XPeX Academy is **`southamerica-east1` (São Paulo, Brazil)**.

### 3.2 Service Availability Audit in `southamerica-east1`
| GCP Service | Available in `southamerica-east1`? | SLA / Architecture Readiness |
|---|---|---|
| **Cloud Run** | Yes | 99.95% monthly uptime SLA. WebSockets, HTTP/2, auto-scaling supported. |
| **Cloud SQL (PostgreSQL)** | Yes | Multi-zone High Availability (HA) supported. `pgvector` supported on PG 15/16. |
| **Memorystore for Redis** | Yes | Standard & Basic tiers available. Private Service Access VPC integration. |
| **Cloud Storage** | Yes | Regional bucket (`southamerica-east1`) provides lowest latency and zero regional egress to Cloud Run. |
| **Artifact Registry** | Yes | Regional Docker repositories supported. |
| **Cloud Build** | Yes | Builds can execute in `southamerica-east1` or `us-central1` with regional artifacts. |
| **Secret Manager** | Yes | Global with regional secret replication support. |
| **Cloud Tasks / PubSub** | Yes | Regional queues supported in São Paulo. |
| **Cloud Run Jobs** | Yes | Full support for batch tasks up to 24h duration. |
| **Gemini API (Google AI Studio)** | Global Endpoint | Low-latency ingress via Google Front End (GFE) network edge. |
| **Vertex AI (Gemini 1.5/2.0)** | Supported / Multi-region | Direct API access via Google internal backbone. |

### 3.3 Latency & Regional Network Advantages
- **Brazilian Student Base**: Average RTT drops from ~120-160ms (US-based PaaS) to **15-35ms** for users across São Paulo, Rio de Janeiro, Brasília, and major Brazilian metropolitan areas.
- **Service-to-Service Co-location**:
  - Cloud Run ↔ Cloud SQL latency: `< 2ms` over Serverless VPC Access.
  - Cloud Run ↔ Memorystore latency: `< 1.5ms`.
  - Cloud Run ↔ Cloud Storage egress: **$0.00** (intra-region GCS to Cloud Run egress is free).

---

## 4. Compute Architecture: Cloud Run

### 4.1 Deployment Topologies: Phase 1 vs Phase 2

#### Phase 1: Combined Container Lift-and-Validate
- Deploys the existing multi-stage combined container (`Dockerfile`) directly to Cloud Run.
- Single service listening on `$PORT` managed by Nginx, PM2 running Next.js, FastAPI, and Collab internally.
- Advantage: Proves database, Redis, and storage parity on GCP with zero routing change.

#### Phase 2: Decoupled Cloud-Native Services (Target)
Deconstructs the monolith into three independent Cloud Run services:
1. **`xpex-api`** (FastAPI):
   - Image: Built from `apps/api/Dockerfile`.
   - Port: `$PORT` (Cloud Run default 8080).
   - Scaling: Min 1, Max 15 instances.
   - CPU: 2 vCPU, 2 GB RAM.
   - Concurrency: 80 requests/instance.
2. **`xpex-web`** (Next.js 16 SSR):
   - Image: Built from `apps/web/Dockerfile`.
   - Port: `$PORT` (8080).
   - Scaling: Min 1, Max 10 instances.
   - CPU: 1 vCPU, 1 GB RAM.
3. **`xpex-collab`** (Hocuspocus / Yjs WebSockets):
   - Image: Built from `apps/collab/Dockerfile`.
   - Port: `$PORT` (8080).
   - WebSockets: Native HTTP/2 & WebSocket support on Cloud Run with session affinity.
   - Timeout: 3600 seconds (1 hour).

---

## 5. Storage Architecture: Cloud Storage (GCS)

### 5.1 Bucket Topology
| Bucket Name | Storage Class | Access Control | Purpose |
|---|---|---|---|
| `xpex-media-prod-sa1` | Regional (`southamerica-east1`) | Uniform / Private (No public read) | Course video lesson renders, audio narrations, transcripts, raw uploads |
| `xpex-assets-prod-sa1` | Regional (`southamerica-east1`) | Public Read or CDN | Course thumbnails, open cover graphics, public brand assets |
| `xpex-backups-prod-sa1` | Nearline (`southamerica-east1`) | Strict Admin Only | Automated Cloud SQL dumps, disaster recovery snapshots |

### 5.2 Storage Integration Contract
- Uses `LEARNHOUSE_CONTENT_DELIVERY_TYPE=s3api`.
- Endpoint: `https://storage.googleapis.com` (Google Cloud Storage XML API / S3 Interoperability).
- Media files are accessed via **HMAC Service Account Keys** or native signed URLs generated by the API (`generate_presigned_get_url`).
- **Security Rule**: Private student documents and unapproved video lessons are **never** publicly accessible without signed authorization.

---

## 6. Asynchronous Processing & Video Lesson Factory

### 6.1 Heavy Video Render Strategy
- In accordance with Section 7 of the Handoff: **Never run heavy ffmpeg rendering inside synchronous Cloud Run web requests.**
- Architecture:
  1. API receives course generation command → creates `XPeXVideoJob` row in PostgreSQL.
  2. API submits a task to **Cloud Tasks** (or triggers a **Cloud Run Job**).
  3. Cloud Run Job launches a dedicated container instance (up to 4 vCPU, 8 GB RAM) with `ffmpeg`, `edge-tts`, and fonts installed.
  4. Worker claims job via `FOR UPDATE SKIP LOCKED`, performs narration, video assembly, renders MP4, writes to Cloud Storage, and sets state to `AWAITING_HUMAN_APPROVAL`.
  5. Job execution completes. Zero idle compute cost incurred.

---

## 7. Observability & Operations

- **Cloud Logging**: Structured JSON logging from FastAPI, Next.js, and Collab automatically collected by Google Cloud Logging agent.
- **Cloud Monitoring**: Dashboards tracking latency (p50, p95, p99), HTTP 4xx/5xx rates, active container instances, Cloud SQL CPU & storage utilization.
- **Cloud Trace**: Distributed tracing through OpenTelemetry / Cloud Run native tracing.
- **Error Reporting**: Real-time stack trace aggregation for Python and TypeScript exceptions.
