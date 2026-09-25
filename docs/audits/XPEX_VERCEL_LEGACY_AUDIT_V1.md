# XPeX Academy — Vercel Legacy Audit & Decommission Report V1

**Mission ID:** `XPEX-LEGACY-VERCEL-DECOMMISSION-001`  
**Program:** XPeX Academy — Infrastructure Simplification & Launch Readiness  
**Target Repository:** `xpex-systems-ai/XPEX-ACADEMY`  
**Base Branch:** `dev`  
**Execution Branch:** `ops/legacy-vercel-decommission-v1`  
**Owner:** Junior Sena  
**Architect / Auditor:** GX / GXEON  
**Primary Executor:** Google Antigravity  
**Audit Date:** 2026-09-25  

---

## 1. Executive Summary

A comprehensive infrastructure audit was performed to determine why Vercel checks remain attached to pull requests on `xpex-systems-ai/XPEX-ACADEMY` (specifically PR #248) and to safely remove Vercel from the official release path without breaking existing deployments, deleting projects, or causing production downtime.

### Key Audit Findings
1. **Zero Production Traffic:** Production workloads are 100% hosted between **Firebase Hosting** (`xpex-academy-stage.web.app`) and **Railway** (`kelle-digital-lab.up.railway.app`). Vercel serves 0% of canonical student/user traffic.
2. **Zero Custom Domain Dependencies:** No apex or branded custom domains (`xpex.com`, `xpexacademy.com`, etc.) point to Vercel.
3. **5 Distinct Connected Projects:** During the early beta phase (August 2026), 5 separate Vercel projects were connected to the repository due to monorepo root directory misconfigurations.
4. **Root Cause of Failed PR Check on `xpex-academy-ai`:**
   In August 2026, an `ignoreCommand` was implemented to quarantine the 4 duplicate projects while forcing `xpex-academy-ai` to build on every commit. Because the modern XPeX stack standardized on Next.js 16 + pnpm/npm and Firebase/Railway, the legacy Vercel build environment failed, creating red status checks on PR #248.
5. **Safe Decommissioning Solution:**
   By updating `ignoreCommand` to `exit 0` across all three `vercel.json` files, all 5 projects immediately skip builds on Vercel without error, preserving project history, environment variables, and zero downtime.

---

## 2. Comprehensive Vercel Project Inventory & Classification

| Project Name | Project ID | Root Directory | Status Context | Domain Dependency | Classification | Decommission Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`xpex-academy-ai`** | `prj_EvLi9wcPcy2p7op1ChdvI8kPksKV` | `apps/web` | `Vercel – xpex-academy-ai` | **NONE** (`*.vercel.app` only) | **LEGACY** | `ignoreCommand` set to `exit 0` (builds skipped) |
| **`xpex-academy`** | `prj_EjFGUFVEUm6adcZhhjN4ujtIEj9y` | Root `/` | `Vercel – xpex-academy` | **NONE** | **DUPLICATE** | `ignoreCommand` set to `exit 0` (builds skipped) |
| **`xpex-academy-536s`** | `prj_lusVrpATbArDHBafb4VQAvh14TyE` | `apps/` | `Vercel – xpex-academy-536s` | **NONE** | **DUPLICATE** | `ignoreCommand` set to `exit 0` (builds skipped) |
| **`xpex-academy-3rb4`** | `prj_XCgo9X30sb5L4Pu2aEQBnQILXlix` | Unknown | `Vercel – xpex-academy-3rb4` | **NONE** | **DUPLICATE** | `ignoreCommand` set to `exit 0` (builds skipped) |
| **`xpex-academy-sfh6`** | `prj_llFFgrz69J0emeMgZhVeZdAMlz8Z` | Unknown | `Vercel – xpex-academy-sfh6` | **NONE** | **DUPLICATE** | `ignoreCommand` set to `exit 0` (builds skipped) |

---

## 3. Special Audit: `xpex-academy-ai`

| Question | Investigation Result | Conclusion |
| :--- | :--- | :--- |
| 1. Does production use it? | Verified: All CTAs and production assets point to Railway and Firebase Hosting. | **NO** |
| 2. Does any public domain point to it? | No DNS A/CNAME records point custom domains to this project. | **NO** |
| 3. Does Firebase depend on it? | Firebase operates independently with its own Hosting and client SDK. | **NO** |
| 4. Does Railway depend on it? | Railway runs FastAPI, Next.js, and RAG independently. | **NO** |
| 5. Does authentication reference it? | Authentication redirects strictly route to `/login?next=...` on Railway. | **NO** |
| 6. Does OAuth reference it? | OAuth callback URLs are configured for Railway and local development. | **NO** |
| 7. Does CORS reference it? | Production CORS allows Railway and local dev origins. | **NO** |
| 8. Does any webhook reference it? | Stripe / Loops / external webhooks route to Railway `/api/billing/webhook`. | **NO** |
| 9. Is it just an old Git integration? | Yes, created during early V6 beta testing before the Firebase decision. | **YES** |
| 10. Is it a duplicate project? | One of 5 historical projects attached to the same repository. | **YES** |

---

## 4. Zero-Downtime Live Verification Evidence

Live endpoints were probed on 2026-09-25:

| Service / Route | Probed URL | Response | Operational Status |
| :--- | :--- | :--- | :--- |
| **Firebase Frontend** | `https://xpex-academy-stage.web.app` | **HTTP 200** | **PASS (Healthy)** |
| **Railway Health** | `https://kelle-digital-lab.up.railway.app/health` | **HTTP 200** | **PASS (Healthy)** |
| **Railway API Health** | `https://kelle-digital-lab.up.railway.app/api/health` | **HTTP 200** | **PASS (Healthy)** |
| **Login Route** | `https://kelle-digital-lab.up.railway.app/login?next=%2Fxpex` | **HTTP 200** | **PASS (Healthy)** |
| **Courses Route** | `https://kelle-digital-lab.up.railway.app/xpex/courses` | **HTTP 307** (Redirect to login) | **PASS (Secured)** |
| **Student Shell** | `https://kelle-digital-lab.up.railway.app/xpex/aluno` | **HTTP 307** (Redirect to login) | **PASS (Secured)** |
| **GXEON Copilot** | `https://kelle-digital-lab.up.railway.app/xpex/gxeon` | **HTTP 307** (Redirect to login) | **PASS (Secured)** |
| **AI Lab Studio** | `https://kelle-digital-lab.up.railway.app/xpex/ai-lab` | **HTTP 307** (Redirect to login) | **PASS (Secured)** |

---

## 5. Decommissioning Implementation Details

### Configuration Modifications
In all three repository configuration locations:
* `/vercel.json`
* `/apps/vercel.json`
* `/apps/web/vercel.json`

The `ignoreCommand` was changed from:
```bash
if [ "$VERCEL_PROJECT_ID" = "prj_EvLi9wcPcy2p7op1ChdvI8kPksKV" ]; then exit 1; fi; ...
```
To:
```bash
echo 'Vercel legacy decommissioned: canonical stack is GitHub + Firebase + Railway' && exit 0
```

### Result on CI and PR Checks
* Vercel will evaluate `ignoreCommand` on every webhook, receive exit code `0`, and immediately cancel/skip the build.
* No compute time or concurrency is consumed on Vercel.
* Vercel checks on GitHub will no longer fail or block pull requests.

### Administrative Clean Disconnect (Recommended Next Step in Vercel UI)
For full platform hygiene, the account owner may optionally open each of the 5 projects in the [Vercel Dashboard](https://vercel.com/dashboard):
1. Navigate to **Project Settings** -> **Git**.
2. Under **Connected Git Repository**, click **Disconnect**.
*(Note: Do NOT delete the project, in accordance with the zero-destructive-delete policy).*

---

## 6. Rollback Plan

If Vercel builds ever need to be temporarily re-enabled:
1. Edit `/apps/web/vercel.json` and change `ignoreCommand` back to allow the specific project ID.
2. Commit and push to the desired branch.
3. No projects, environment variables, or historical deployments have been deleted, allowing instantaneous restoration.
