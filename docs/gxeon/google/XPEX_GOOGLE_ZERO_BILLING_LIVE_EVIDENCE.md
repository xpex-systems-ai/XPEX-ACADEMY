# XPEX × GOOGLE — GXEON ZERO-BILLING LIVE BRIDGE EVIDENCE
## MISSION_ID: XPEX-GOOGLE-LIVE-ZERO-BILLING-001

---

## 1. Executive Summary

- **Mission ID:** `XPEX-GOOGLE-LIVE-ZERO-BILLING-001`
- **Execution Date:** 2026-09-23
- **Owner:** Junior Sena
- **Architect / Auditor:** GX / GXEON
- **Engineering Executor:** Google Antigravity
- **Mode Chosen:** `MODE B — OFFICIAL XPEX GOOGLE PORTAL` (Firebase Hosting + Railway Application Engine bridge)
- **Primary Deliverable:** Public Google/Firebase URL online with **Zero Billing** (Spark Plan). GX audit found the original CTA target stale; source has been corrected and requires Firebase redeploy + smoke test before merge approval.

---

## 2. Infrastructure Identity & URLs

| Property | Value |
| :--- | :--- |
| **Firebase Project ID** | `xpex-academy-stage` |
| **Project Number** | `364943107161` |
| **Firebase Plan** | **Spark (100% Free / Zero Billing)** |
| **Cloud Billing State** | `billingEnabled: false` |
| **Primary Public Google URL** | **`https://xpex-academy-stage.web.app`** |
| **Secondary Public Google URL** | **`https://xpex-academy-stage.firebaseapp.com`** |
| **Application Runtime Destination** | `https://kelle-digital-lab.up.railway.app/login?next=%2Fxpex` |
| **Cost Incurred** | **R$ 0,00** |

---

## 3. Architecture & Mode Selection Rationale

Following **Directive 7**:
- `apps/web` contains a stateful, multi-tenant Next.js application requiring Node.js SSR runtime (`server-wrapper.js`, dynamic tenancy proxying, session cookies, database connectivity). Flattenting this setup to static HTML would strip critical student/teacher features.
- In accordance with the GXEON decision tree, **MODE B** was selected:
  - An official, ultra-fast, responsive public entry portal was deployed directly to **Firebase Hosting**.
  - All primary and secondary CTAs are configured in source to route to the verified canonical XPeX Academy runtime (`https://kelle-digital-lab.up.railway.app/login?next=%2Fxpex`). A Firebase redeploy is required to publish this correction.
  - Student identity, PostgreSQL data, and Redis caches remain strictly preserved on the existing platform.

---

## 4. Zero-Billing Audit

| Check | Expected | Actual | Audit Result |
| :--- | :--- | :--- | :--- |
| **Firebase Plan** | SPARK | SPARK | **PASS** |
| **Billing Enabled** | FALSE | FALSE | **PASS** |
| **Paid Resources Created** | NONE | NONE | **PASS** |
| **Cloud Run Created** | FALSE | FALSE | **PASS** |
| **Cloud SQL Created** | FALSE | FALSE | **PASS** |
| **Memorystore Created** | FALSE | FALSE | **PASS** |
| **Cloud Functions** | FALSE | FALSE | **PASS** |

---

## 5. Verification & Smoke Test Results

### 5.1 Public Root Endpoint (`GET /`)
- **URL:** `https://xpex-academy-stage.web.app`
  - **Status:** `200 OK`
  - **Content-Type:** `text/html; charset=utf-8`
  - **Payload Size:** ~25.5 KB
  - **SSL/TLS:** Google Trust Services (Valid HTTPS)
  - **Page Title:** `XPeX Academy — Aprenda e Construa com Inteligência Artificial`
  - **Hero Heading:** `Aprenda. Crie. Construa com Inteligência Artificial.`

- **URL:** `https://xpex-academy-stage.firebaseapp.com`
  - **Status:** `200 OK`
  - **Content-Type:** `text/html; charset=utf-8`
  - **Payload Size:** ~25.5 KB
  - **SSL/TLS:** Google Trust Services (Valid HTTPS)

### 5.2 404 Route Handling
- **URL:** `https://xpex-academy-stage.web.app/notfound`
  - **Status:** `404 Not Found`
  - **Branded 404 Page:** Verified

### 5.3 CTA Target Verification
- **Header CTA (source):** `https://kelle-digital-lab.up.railway.app/login?next=%2Fxpex`
- **Hero Primary CTA (source):** `https://kelle-digital-lab.up.railway.app/login?next=%2Fxpex`
- **Footer links (source):** Terms and Privacy on the verified `kelle-digital-lab.up.railway.app` production domain.
- **GX audit note:** the first deployed revision pointed to the stale `xpex-academy-ai.up.railway.app` domain and therefore the live CTA failed. Redeploy + re-test is mandatory before approval.

### 5.4 Mobile & Accessibility Audit
- **Responsive targets reviewed:** 360px, 390px, 768px, 1440px
- **Layout:** Mobile-first flex/grid design. Browser-level viewport evidence should be captured after redeploy before merge approval.
- **Aesthetics:** Dark obsidian (`#0B1220`), neon orange (`#FF7A00`), cyan (`#00D4FF`), glassmorphism card surfaces.

---

## 6. Files Added / Modified

```
deployment/firebase/
├── .firebaserc
├── .gitignore
├── firebase.json
└── public/
    ├── 404.html
    ├── index.html
    ├── robots.txt
    └── sitemap.xml
docs/gxeon/google/
├── PR_BODY.md
└── XPEX_GOOGLE_ZERO_BILLING_LIVE_EVIDENCE.md
```

---

### Scope Integrity

This release is intentionally limited to the Firebase public entry layer. Unrelated M&A/Web3 acquisition material that was temporarily introduced into the same branch was removed from this PR. Its pre-cleanup snapshot is preserved separately at:

`archive/pr243-mna-web3-experiments-2026-09-23`

It is outside this release.

---

## 7. Limitations & Future Migration Path

1. **GX Enterprise Gate Before Merge:**
   - Redeploy the latest cleaned Firebase source.
   - Confirm the removed sale `.well-known` manifests are no longer published.
   - Verify the live CTA resolves to the canonical Railway login.
   - Verify the latest hardened response headers are present.
   - Verify `robots.txt` and `sitemap.xml` are live.
   - Capture browser-level mobile evidence.
2. **Hybrid Bridge Nature:**
   - The public entry layer is hosted on Google Firebase infrastructure.
   - Authentication, course database, and dynamic backend logic currently reside on Railway.
3. **Future Path to Full Cloud Run (When Billing is Active):**
   - Once billing is enabled by Junior Sena in Google Cloud Console, the full multi-service Docker container can be deployed to Cloud Run (`southamerica-east1`) without impacting this live Firebase front door.
   - Firebase Hosting can then be pointed to Cloud Run via native rewrites (`"rewrites": [{ "source": "**", "run": { "serviceId": "xpex-academy-prod", "region": "southamerica-east1" } }]`).

---

## 8. Rollback Strategy

If rollback of this layer is required:
1. `firebase hosting:disable --project xpex-academy-stage` instantly shuts down the Firebase Hosting site.
2. Railway and production runtime are untouched and will suffer **zero impact**.
