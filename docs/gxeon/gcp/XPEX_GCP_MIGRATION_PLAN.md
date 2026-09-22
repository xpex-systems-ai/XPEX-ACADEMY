# XPeX Academy — Google Cloud Platform Migration Plan

**Document:** `docs/gxeon/gcp/XPEX_GCP_MIGRATION_PLAN.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Phased Migration Plan (Dry-Run / Architecture Only — Zero Production Mutation)  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Governance & Strict Invariants

In strict adherence to the GXEON Engineering Manifesto and Mission Directives:

> **SUPREME RULE:**  
> PRESERVE → AUDIT → MAP → DESIGN → TEST PLAN → OPEN PR → STOP  
> **DO NOT** delete Railway resources.  
> **DO NOT** destroy Railway databases.  
> **DO NOT** disconnect current production.  
> **DO NOT** rotate or expose secrets.  
> **DO NOT** alter DNS records in this phase.  
> **NO production migration occurs in this PR.**

Railway remains operational as:
1. Active production serving students and teachers today.
2. The authoritative rollback environment.
3. Historical and diagnostic evidence repository.

---

## 2. Migration Phases Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PHASE 0    │────►│   PHASE 1    │────►│   PHASE 2    │
│ Discovery &  │     │ GCP Found-   │     │ Data Staging │
│ Architecture │     │ ation Setup  │     │ & Media Sync │
│  (THIS PR)   │     │ (Terraform)  │     │  (Rehearsal) │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
┌──────────────┐     ┌──────────────┐     ┌──────┴───────┐
│   PHASE 5    │◄────│   PHASE 4    │◄────│   PHASE 3    │
│ Controlled   │     │ Final Delta  │     │ Staging Test │
│ DNS Cutover  │     │ Sync & Freeze│     │ & Verification│
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
┌──────▼───────┐
│   PHASE 6    │
│ Railway Post-│
│ Cutover Hold │
│ (Standby)    │
└──────────────┘
```

---

## 3. Detailed Phase Breakdown

### Phase 0: Discovery & Architecture (Completed in this PR)
- Full code and infrastructure audit.
- Service mapping from Railway PaaS to GCP services.
- Verification of Cloud Run readiness, runtime constraints, and video pipeline decoupling.
- Creation of the GCP foundation baseline documentation.

---

### Phase 1: GCP Infrastructure Foundation (Future PR)
*Zero impact on active Railway traffic.*
1. **GCP Project Setup**:
   - Create dedicated project `xpex-academy-prod` in organization.
   - Enforce billing budget alerts and cost guardrails.
   - Enable required APIs: `run.googleapis.com`, `sqladmin.googleapis.com`, `redis.googleapis.com`, `storage.googleapis.com`, `secretmanager.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`, `vpcaccess.googleapis.com`.
2. **Network & Security**:
   - Create custom VPC in `southamerica-east1` (São Paulo).
   - Configure Serverless VPC Access Connector (`10.8.0.0/28`).
   - Create private service connection for Cloud SQL and Memorystore (Private IP only).
3. **Storage & Secrets**:
   - Provision Cloud Storage buckets (`xpex-media-prod-sa1`, `xpex-assets-prod-sa1`, `xpex-backups-prod-sa1`).
   - Create secrets in Google Secret Manager (`learnhouse-jwt-secret`, `learnhouse-db-password`, `learnhouse-redis-url`, `learnhouse-gemini-key`, `mercadopago-access-token`).
4. **Data Stores**:
   - Provision Cloud SQL for PostgreSQL 16 (2 vCPU, 8 GB RAM, SSD, Multi-AZ HA).
   - Enable `pgvector` extension.
   - Provision Memorystore for Redis 7.2 (1 GB Basic/Standard tier).

---

### Phase 2: Data Replication & Media Sync (Staging Rehearsal)
*Zero interruption to active Railway users.*
1. **PostgreSQL Migration Rehearsal**:
   - Generate consistent snapshot dump from Railway PostgreSQL:
     ```bash
     pg_dump -h $RAILWAY_PG_HOST -U $RAILWAY_PG_USER -d $RAILWAY_PG_DATABASE \
       --format=custom --no-owner --no-privileges \
       --file=railway_migration_test.dump
     ```
   - Stage the dump into `gs://xpex-backups-prod-sa1/staging/`.
   - Restore into Cloud SQL staging instance:
     ```bash
     gcloud sql import custom-dump xpex-sql-staging \
       gs://xpex-backups-prod-sa1/staging/railway_migration_test.dump \
       --database=learnhouse
     ```
   - Run verification script: Row counts, schema consistency, integrity checks across `users`, `courses`, `xpex_editorial_drafts`, `xpex_video_jobs`, and `course_embeddings`.
2. **Media Assets Sync Rehearsal**:
   - Enumerate all files under Railway `/data/xpex-media` and `apps/api/content`.
   - Transfer existing media to Cloud Storage using `gsutil rsync` or `gcloud storage rsync`:
     ```bash
     gcloud storage rsync /data/xpex-media gs://xpex-media-prod-sa1/media --recursive
     ```
   - Verify SHA-256 checksums of transferred video lesson MP4s and VTT captions.
3. **Redis Cutover Decision**:
   - **Audit finding**: Redis stores user session blocklists (`jwt_revoked_before`), token rotation grace windows, temporary Yjs collab state, and rate limits.
   - **Decision**: Cold cutover for Redis is safe and recommended. Running a live Redis replication across PaaS boundaries adds high fragility for data that is strictly transient. Users whose tokens are still valid in JWT signature continue working; revoked tokens expire naturally within the 8-hour JWT window.

---

### Phase 3: Staging Parity & Verification
1. **Deploy Staging Cloud Run Service**:
   - Build container from `Dockerfile` or `apps/api/Dockerfile`.
   - Push to Artifact Registry: `southamerica-east1-docker.pkg.dev/xpex-academy-prod/xpex-containers/xpex-api:staging`.
   - Deploy to Cloud Run with VPC connector and Secret Manager bindings.
2. **Automated & Manual Parity Tests**:
   - Execute test suite (`uv run pytest`).
   - Call `GET /api/v1/health` (verify DB and Redis OK).
   - Call `GET /api/v1/xpex/ai-gateway/health` with test token (verify GXEON AI Gateway status is `ready` and zero secrets exposed).
   - Verify student login flow, course catalog listing, video playback via presigned GCS URLs, and lesson draft generation.

---

### Phase 4: Pre-Cutover Freeze & Delta Sync
1. **Maintenance Notification**:
   - Announce a scheduled 30-minute maintenance window during low-traffic hours (e.g. Sunday 03:00-03:30 BRT).
2. **Maintenance Mode on Railway**:
   - Set frontend banner notifying users of brief scheduled maintenance.
   - Temporarily pause background video generation queues (`XPEX_COURSE001_VIDEO_CANARY_ON_START=0`).
3. **Final Delta Database Sync**:
   - Perform final differential `pg_dump` from Railway.
   - Apply delta dump to production Cloud SQL.
   - Verify table row counts match exactly between Railway and Cloud SQL.
4. **Final Media Delta Sync**:
   - Run final `gcloud storage rsync` to capture any newly uploaded student assets or generated audio files.

---

### Phase 5: Controlled DNS Cutover
1. **Cloud Run Domain Mapping / Cloud Load Balancer**:
   - Configure Google Cloud Load Balancer (or Cloud Run custom domain) with Google-managed SSL certificates for `academy.xpex.com.br` / `xpex.com.br`.
2. **DNS TTL Reduction (48h prior to cutover)**:
   - Lower DNS TTL to 300 seconds (5 minutes) across Cloudflare / Route 53 / registrar.
3. **DNS Pointer Update**:
   - Point DNS A/AAAA or CNAME records from Railway ingress to Google Cloud Load Balancer IP.
4. **Live Verification**:
   - Monitor real-time traffic shift in Cloud Logging and Railway Metrics.
   - Validate live HTTP 200 responses, WebSocket connections on `/collab`, and zero 5xx spikes.
   - Lift maintenance mode.

---

### Phase 6: Post-Cutover Railway Preservation (Hold)
1. **Keep Railway in Standby**:
   - Keep Railway services active in read-only or standby mode for **minimum 14 days**.
   - Do NOT delete the Railway project or PostgreSQL instance.
2. **Rollback Trigger Conditions**:
   - If Cloud SQL experiences unrecoverable latency or critical data anomaly within 2 hours of cutover:
     1. Revert DNS records to Railway IP (effective within 5 minutes due to low TTL).
     2. Restore any transactional delta created on GCP back into Railway.
     3. Railway resumes primary traffic.
3. **Archive Procedure**:
   - After 14 days of confirmed, stable GCP production:
     - Export full final dump from Railway PostgreSQL to `gs://xpex-backups-prod-sa1/railway-archive/`.
     - Export full filesystem snapshot of Railway volume to Cloud Storage.
     - Downgrade Railway resources to dormant/paused state to prevent unnecessary charges while preserving complete historical evidence.
