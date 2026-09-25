# XPeX Academy — Canonical Production Infrastructure Architecture V1

**Mission ID:** `XPEX-LEGACY-VERCEL-DECOMMISSION-001`  
**Program:** XPeX Academy — Infrastructure Simplification & Launch Readiness  
**Target Repository:** `xpex-systems-ai/XPEX-ACADEMY`  
**Base Branch:** `dev`  
**Feature Branch:** `ops/legacy-vercel-decommission-v1`  
**Owner:** Junior Sena  
**Architect / Auditor:** GX / GXEON  
**Primary Executor:** Google Antigravity  
**Status:** ARCHITECTURE LOCKED — DECOMMISSION ACTIVE  

---

## 1. Executive Declaration

Before public launch, the XPeX Academy architecture is streamlined to the smallest reliable production stack possible.

The target infrastructure consists strictly of **three canonical pillars**:

```text
                        USERS & CLIENTS
                               │
               ┌───────────────┴───────────────┐
               │                               │
               ▼                               ▼
      FIREBASE HOSTING                 FIREBASE FABRIC
   (Public Google Portal)          (Telemetry & Edge Services)
   https://xpex-academy-stage.web.app  - Analytics (PII-free)
                                       - App Check (observe mode)
                                       - Remote Config (defaults)
                                       - Performance Tracing
                                       - FCM Messaging Capability
                               │
                               ▼
                        RAILWAY RUNTIME
                  https://kelle-digital-lab.up.railway.app
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
          Next.js SSR       FastAPI        GXEON Core
        (Student Shell)  (Learning APIs)   (RAG / Gemini)
                               │
                               ▼
                     POSTGRESQL & SQLITE DB
```

---

## 2. The Three Canonical Pillars

### 2.1 GITHUB — Source, CI & Collaboration
* **Source of Truth:** Canonical repository `xpex-systems-ai/XPEX-ACADEMY`.
* **Branch Policy:** `dev` (integration baseline), feature branches (`feat/*`, `ops/*`), pull requests.
* **CI Quality Gates:**
  - Automated contract test suite (`node --test tests/*.contract.test.mjs`).
  - Next.js type check (`npx tsc --noEmit`).
  - Code hygiene and linting (`npx eslint`).
  - Production build verification (`npm run build`).

### 2.2 FIREBASE — Experience, Edge & Observability Fabric
* **Target Project:** `xpex-academy-stage` (`364943107161`).
* **Hosting:** Public entry portal at `https://xpex-academy-stage.web.app` (Spark Free Tier, `billingEnabled: false`).
* **Fabric Services:**
  - **Analytics:** PII-sanitized telemetry with safe tenant context injection (`tenant_id`, `user_role`).
  - **App Check:** Non-blocking staged rollout (`observe` mode default).
  - **Remote Config:** Code-authoritative safe defaults for all feature flags.
  - **Performance:** Automated web trace monitoring (`xpex_student_shell_boot`).
  - **Messaging:** Capability probe without automatic user-facing prompts.
  - **Mobile:** Pre-configured foundation for future iOS / Android app distribution.

### 2.3 RAILWAY — Persistent Runtime, Learning APIs & AI Gateway
* **Target Environment:** `kelle-digital-lab.up.railway.app`.
* **Runtime Services:**
  - **Next.js SSR Shell:** Authenticated student, instructor, and polo experience (`/xpex/*`).
  - **FastAPI Core:** Learning management, course enrollment, activities, and permissions.
  - **GXEON Core & RAG:** Server-side AI gateway, Gemini routing, document retrieval, and vector search.
  - **Database:** Persistent storage for user records, courses, certificates, and progress.

---

## 3. VERCEL — Legacy Decommissioning

Following rigorous technical audit under mission `XPEX-LEGACY-VERCEL-DECOMMISSION-001`:

1. **Production Status:** Vercel serves **ZERO** canonical production workloads. All live traffic and CTAs route to Firebase and Railway.
2. **Domain Status:** No custom production domains (`xpex.com`, etc.) point to Vercel.
3. **Decommission Mechanism:**
   - All `vercel.json` configurations (`/vercel.json`, `/apps/vercel.json`, `/apps/web/vercel.json`) have their `ignoreCommand` set to:
     `echo 'Vercel legacy decommissioned: canonical stack is GitHub + Firebase + Railway' && exit 0`
   - This prevents all connected Vercel projects from building or consuming resources on push/PR events.
   - All Vercel status checks on GitHub PRs will automatically resolve without failure.
   - Historical deployments, project history, and environment variables remain safely archived on Vercel without deletion.

---

## 4. Rollback & Contingency Plan

If for any unforeseen operational reason a legacy Vercel preview deployment is temporarily needed:
1. Revert the `ignoreCommand` in `vercel.json` to target the specific project ID.
2. Push to the target branch.
3. Historical Vercel settings and configurations remain completely intact.
