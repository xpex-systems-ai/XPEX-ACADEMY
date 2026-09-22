# XPeX Academy — Google Cloud Platform Cost Guardrails & Governance

**Document:** `docs/gxeon/gcp/XPEX_GCP_COST_GUARDRAILS.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Cost Governance Policy  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Executive Cost Principles

1. **Explicit Budget Caps**: Cloud infrastructure must have hard monitoring thresholds and automated billing alerts before live traffic is routed.
2. **Conservative Autoscaling Limits**: Cloud Run instances are strictly capped (`max-instances`) to prevent runaway scaling during traffic anomalies or DDoS attacks.
3. **Storage & Log Lifecycles**: All logs, temporary build artifacts, and staging media have automatic expiration policies.
4. **Google AI Pro Subscription Clarification**:
   > **CRITICAL RULE:** As established in PR #241, **a consumer Google AI Pro subscription is NOT production API quota**. Production Gemini API calls and Google Cloud compute are billed against the Google Cloud Billing Account. Free-tier or consumer allowances must never be planned as production capacity.

---

## 2. Service-by-Service Sizing & Cost Guardrails

### 2.1 Compute: Cloud Run
| Service | CPU / Memory Allocation | Min Instances | Max Instances (Guardrail) | Concurrency | Expected Monthly Idle Cost | Expected Active Cost |
|---|---|---|---|---|---|---|
| **`xpex-api`** | 2 vCPU / 2 GiB | 1 (Warm start) | **10** (Hard limit) | 80 | ~$25 / mo | ~$45 - $90 / mo |
| **`xpex-web`** | 1 vCPU / 1 GiB | 1 (Warm start) | **8** (Hard limit) | 80 | ~$15 / mo | ~$25 - $50 / mo |
| **`xpex-collab`** | 1 vCPU / 512 MiB | 0 (Scale to zero) | **4** (Hard limit) | 100 | $0 / mo | ~$10 - $25 / mo |
| **`xpex-video-render`** (Job) | 4 vCPU / 8 GiB | 0 (On-demand) | **2 concurrent jobs** | 1 | $0 / mo | Pay-per-render seconds only |

**Guardrail Mechanism**:
- `spec.template.metadata.annotations.autoscaling.knative.dev/maxScale` is strictly locked in deployment manifests.
- CPU is allocated **only during request processing** for Web and API (`cpu-throttling = true`), saving up to 80% during low-traffic overnight hours.

### 2.2 Relational Database: Cloud SQL (PostgreSQL 16)
- **Staging Tier**: `db-f1-micro` or `db-g1-small` (Shared vCPU, 1.7 GB RAM, 10 GB SSD, single-zone). Estimated cost: ~$18 - $30 / month.
- **Production Initial Sizing**: `db-custom-2-7680` (2 vCPU, 7.5 GB RAM, 30 GB SSD, Automatic Storage Increase enabled up to 100 GB).
- **High Availability**: Regional HA (Multi-zone failover) activated for production.
- **Connection Pooling**: SQLModel / asyncpg connection pool configured with `pool_size=15`, `max_overflow=5` per instance to prevent exhausting database max connections.

### 2.3 In-Memory Cache: Memorystore for Redis
- **Staging Tier**: Basic Tier, 1 GB capacity, standalone. Estimated cost: ~$25 / month.
- **Production Initial Sizing**: Standard Tier (with automated replica failover), 1 GB capacity in `southamerica-east1`.
- **Max Memory Eviction Policy**: `volatile-lru` or `allkeys-lru` configured to guarantee Redis never crashes on OOM.

### 2.4 Object Storage: Cloud Storage (GCS)
- **Storage Class**: Regional (`southamerica-east1`). Zero egress fee when accessed by Cloud Run within the same region.
- **Lifecycle Policies**:
  - `xpex-backups-prod-sa1`: Move to Nearline after 30 days; Coldline after 90 days; delete after 365 days.
  - Temporary video rendering scratch files: Automatically delete after 7 days (`age: 7d`).
  - Raw teacher uploads: Move to Nearline after 60 days.

### 2.5 Observability & Log Retention
- Default Cloud Logging retention (30 days) is free up to 50 GiB/month.
- Exclude debug logs from ingestion using a log exclusion filter:
  ```
  resource.type="cloud_run_revision" AND severity="DEBUG"
  ```
- Retain only INFO, WARNING, ERROR, and CRITICAL logs.

---

## 3. Cloud Billing Budgets & Real-Time Alerts

| Budget Scope | Amount (USD) | Alert Thresholds | Notification Channels | Action |
|---|---|---|---|---|
| **`xpex-staging`** | **$50.00 / mo** | 50% ($25), 80% ($40), 100% ($50) | Email to DevOps / Discord webhook | Notification only |
| **`xpex-prod-baseline`** | **$200.00 / mo** | 50% ($100), 75% ($150), 90% ($180), 100% ($200) | Email to Junior Sena + SRE Pager | Investigation |
| **`xpex-prod-anomaly`** | **$350.00 / mo** | 100% ($350), 120% ($420) | High-priority SMS + Email | Immediate inspection of autoscaling & video render queues |

---

## 4. Egress & Network Cost Controls

1. **CDN Caching**: Put Cloud CDN or Cloudflare in front of static assets (`.next/static/*`, thumbnails, published MP4 videos) to offload ~70-85% of egress traffic.
2. **Intra-Region Traffic**: Ensure Cloud Run, Cloud SQL, Memorystore, and Cloud Storage are all in `southamerica-east1` to ensure **$0.00** intra-zone/intra-region network transfer fees.
3. **Large SCORM / Video Package Uploads**: Uploads are streamed directly into Cloud Storage via presigned PUT URLs, bypassing container memory and eliminating double-hop network bandwidth fees.
