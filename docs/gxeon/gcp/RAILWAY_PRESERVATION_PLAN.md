# XPeX Academy — Railway Production Infrastructure Preservation Plan

**Document:** `docs/gxeon/gcp/RAILWAY_PRESERVATION_PLAN.md`  
**Mission ID:** `XPEX-GCP-FOUNDATION-001`  
**Status:** Mandatory Preservation Baseline  
**Date:** 2026-09-22  
**Author:** Google Antigravity (Engineering Executor)  
**Auditor / Orchestrator:** GX / GXEON  

---

## 1. Executive Mandate

> **SUPREME INVARIANT:**  
> **DO NOT delete Railway resources.**  
> **DO NOT destroy Railway databases or volumes.**  
> **DO NOT disconnect current production.**  
> **DO NOT rotate or invalidate Railway production credentials.**

Railway is not obsolete trash to be discarded; it is:
1. The **active production environment** currently delivering courses to students and teachers.
2. The **authoritative baseline** against which GCP staging parity must be mathematically proven.
3. The **instant rollback environment** if GCP experiences unexpected downtime during or after cutover.
4. The **permanent operational and diagnostic archive** of XPeX Academy's evolution.

---

## 2. Inventory of Preserved Railway Resources

The following resources must remain untouched in the Railway dashboard project:

### 2.1 Project Metadata
- **Project Name**: `resourceful-optimism`
- **Environment**: `production`
- **Primary Domain**: `xpex-academy-ai.up.railway.app`
- **Region**: US-West (Railway default cluster)

### 2.2 Preserved Services
| Railway Service Name | Role | Container / Image | Preserved Port | State / Volume |
|---|---|---|---|---|
| **`XPEX-ACADEMY`** (Combined) | Main Application (Web + API + Collab + Nginx) | Root `Dockerfile` (Multi-stage Bun/Node/Python/Nginx) | `$PORT` (Railway dynamic ingress) | Mounts `/data/xpex-media` volume |
| **`Postgres`** | Primary Database | Railway PostgreSQL 16 Plugin | 5432 (Internal) | Persistent Railway NVMe disk |
| **`Redis`** | Session & Token Cache | Railway Redis 7.2 Plugin | 6379 (Internal) | In-memory with Railway persistence |

### 2.3 Volume Mount
- **Mount Path**: `/data/xpex-media`
- **Variable Ref**: `XPEX_DURABLE_MEDIA_ROOT=/data/xpex-media`
- **Contents**: Rendered course video lessons, MP3 neural narration audio files, VTT subtitle tracks, SCORM packages, instructor uploaded assets.
- **Preservation Policy**: Must remain mounted and unpruned.

---

## 3. Preserved Environment Variables (Names Only)

The following configuration keys in the Railway dashboard must remain active and unchanged:

- `PORT`
- `WEB_PORT`
- `LEARNHOUSE_PORT`
- `COLLAB_PORT`
- `LEARNHOUSE_ENV`
- `LEARNHOUSE_DEVELOPMENT_MODE`
- `LEARNHOUSE_SAAS`
- `LEARNHOUSE_TENANCY`
- `LEARNHOUSE_DOMAIN`
- `LEARNHOUSE_FRONTEND_DOMAIN`
- `LEARNHOUSE_ALLOWED_ORIGINS`
- `LEARNHOUSE_COOKIE_DOMAIN`
- `LEARNHOUSE_SSL`
- `LEARNHOUSE_SQL_CONNECTION_STRING`
- `LEARNHOUSE_REDIS_CONNECTION_STRING`
- `LEARNHOUSE_REDIS_URL`
- `LEARNHOUSE_AUTH_JWT_SECRET_KEY`
- `COLLAB_INTERNAL_KEY`
- `LEARNHOUSE_CONTENT_DELIVERY_TYPE`
- `XPEX_DURABLE_MEDIA_ROOT`
- `LEARNHOUSE_IS_AI_ENABLED`
- `LEARNHOUSE_AI_PROVIDER`
- `LEARNHOUSE_AI_API_KEY`
- `LEARNHOUSE_GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `HF_TOKEN`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `LEARNHOUSE_RESEND_API_KEY`
- `LEARNHOUSE_SYSTEM_EMAIL_ADDRESS`

*(Zero secret values are recorded here or in the repository.)*

---

## 4. Rollback Runbook (Emergency Reversion to Railway)

If, during or within 14 days following the Google Cloud cutover, a blocking production issue occurs on GCP (e.g. data corruption, latency degradation > 500ms, or unexpected service outage):

```
                       EMERGENCY ROLLBACK FLOW
                                  │
                                  ▼
                     1. ASSESS & DECLARE ROLLBACK
                        (Authorizer: Junior Sena)
                                  │
                                  ▼
                   2. EXTRACT DELTA TRANSACTIONS
                   (Query delta rows created on GCP)
                                  │
                                  ▼
                  3. REPLAY DELTA INTO RAILWAY POSTGRES
                     (Insert new student signups/progress)
                                  │
                                  ▼
                       4. SWITCH DNS POINTER
                  (Point DNS records back to Railway)
                                  │
                                  ▼
                       5. VERIFY RAILWAY TRAFFIC
                  (Confirm HTTP 200 on Railway domain)
```

### Execution Steps:
1. **Declare Rollback**: Operator / Junior Sena confirms execution of rollback.
2. **Revert DNS**:
   - Change DNS CNAME / A records from Google Cloud IP/domain back to `xpex-academy-ai.up.railway.app`.
   - With pre-lowered TTL (300s), global DNS traffic reverts within 5 minutes.
3. **Validate Railway Recovery**:
   - Inspect Railway logs: `pm2 status` shows all 3 processes `online`.
   - Call `GET https://xpex-academy-ai.up.railway.app/api/v1/health` → verify status is `ok`.
   - Verify login, course navigation, and video playback on Railway.
4. **Post-Rollback Triage**:
   - Quarantine GCP environment for root-cause analysis without impacting ongoing live operations.

---

## 5. Decommissioning Criteria (Post-14 Days Only)

Railway resources must **NEVER** be decommissioned immediately upon DNS switch. The following checklist is required before any Railway resource modification:

- [ ] GCP has sustained 100% production traffic for at least 14 consecutive days.
- [ ] Zero unresolvable data anomalies or customer incidents reported.
- [ ] Full and final `pg_dump` snapshot exported to `gs://xpex-backups-prod-sa1/railway-final-archive/`.
- [ ] Full rsync of `/data/xpex-media` confirmed with matching SHA-256 checksums in Cloud Storage.
- [ ] Written signoff from Junior Sena and GX/GXEON.
