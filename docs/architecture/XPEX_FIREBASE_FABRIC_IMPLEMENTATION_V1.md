# XPeX Academy × Firebase Fabric Implementation Guide V1

**Mission ID:** `XPEX-FIREBASE-FABRIC-FOUNDATION-001`  
**Program:** XPeX Academy — AI-Native Learning & Creation Platform  
**Target Repository:** `xpex-systems-ai/XPEX-ACADEMY`  
**Base Branch:** `dev`  
**Feature Branch:** `feat/firebase-fabric-foundation-v1`  
**Architecture Manifesto:** `docs/architecture/XPEX_FIREBASE_FABRIC_MANIFESTO_V1.md` (PR #247)  
**Execution Authority:** Google Antigravity  
**Architect / Auditor:** GX / GXEON  
**Owner:** Junior Sena  
**Status:** IMPLEMENTATION COMPLETE — GX HARDENED — PENDING FINAL CI GATE — ZERO BILLING  

---

## 1. Executive Declaration & Scope

In accordance with the **XPeX Firebase Fabric Manifesto V1**, Firebase is established as the **experience, edge, observability, and mobile application fabric** surrounding the canonical XPeX Core.

### Core Mission Invariants (Section 0)
1. **Zero Database / Auth Migration:** LearnHouse, FastAPI, SQLite/PostgreSQL, and Railway remain 100% authoritative for student sessions, credentials, course progress, and RAG vectors.
2. **Zero Paid Resources (Spark Free Tier Only):** The project operates under strict `billingEnabled: false` Spark tier limits. No Cloud Functions, Vertex AI paid APIs, or external paid gateways were provisioned.
3. **Zero Secret Exposure:** No private service account keys, PEM files, or admin credentials exist in frontend code or bundles. Only standard public client identifiers are utilized.
4. **Zero Disruptive Auto-Prompts:** Push notification capability detection runs passively without prompting the student for permission on initial page load.
5. **Non-Blocking Observability:** Staged rollout of App Check in `observe` mode guarantees zero disruption or blockage to student access.

---

## 2. Target Firebase Project Configuration

| Parameter | Staging Value | Verification Status |
| :--- | :--- | :--- |
| **Project ID** | `xpex-academy-stage` | Verified via Firebase CLI |
| **Project Number** | `364943107161` | Verified via Firebase CLI |
| **Billing Plan** | **Spark (Free Tier)** | `billingEnabled: false` confirmed |
| **Canonical Web App ID** | `1:364943107161:web:bc3ab9a50a101115cc7d48` | Verified (`XPEX ACADEMY`) |
| **Measurement ID** | `G-WCQ1XQE5ED` | Verified |
| **Live Hosting Site** | `https://xpex-academy-stage.web.app` | Verified Live |
| **Web Config** | Injected through `NEXT_PUBLIC_FIREBASE_*` environment variables | No project-specific fallback embedded in source |

---

## 3. Fabric Module Architecture (`apps/web/lib/firebase/`)

The Firebase Fabric is structured into isolated, SSR-safe, single-responsibility modules:

```text
apps/web/lib/firebase/
├── types.ts          # Central contracts, service statuses, event & feature flag schemas
├── config.ts         # Environment-driven config reader with staging defaults
├── client.ts         # Singleton FirebaseApp provider with SSR safety guards
├── analytics.ts      # PII-sanitized telemetry logger with forbidden key filters
├── app-check.ts      # Non-blocking App Check provider (observe mode default)
├── remote-config.ts  # Remote Config loader with code-authoritative fallbacks
├── feature-flags.ts  # Typed feature flag getters and inspectors
├── performance.ts    # Web performance trace bootstrap & shell boot metric
├── messaging.ts      # FCM capability probe (ZERO auto-prompt)
├── ai-logic.ts       # Dormant adapter reserving GXEON / FastAPI gateway as canonical
├── events.ts         # Domain event helpers injecting safe multi-tenant context
└── index.ts          # Public facade and truthful status contract (Section 18)
```

### Truthful Service Status Matrix

```json
{
  "ready": true,
  "environment": "production",
  "projectId": "<environment-provided>",
  "services": {
    "app": "available",
    "analytics": "available",
    "appCheck": "configured",
    "remoteConfig": "available",
    "performance": "available",
    "messaging": "available",
    "aiLogic": "disabled"
  }
}
```

---

## 4. Privacy & Telemetry Guardrails

### PII Sanitization (`analytics.ts`)
To protect student confidentiality and comply with LGPD/GDPR standards, the telemetry layer filters all outgoing event payloads against `FORBIDDEN_PII_KEYS`:
- `email`, `user_email`, `student_email`
- `password`, `token`, `access_token`, `secret`, `api_key`
- `name`, `student_name`, `full_name`
- `prompt`, `content`, `answer`, `course_text`, `rag_text`

### Tenant Context Injection (`events.ts`)
Safe contextual telemetry is attached without PII:
- `tenant_id` (e.g. `kelle-digital-lab`, `polo-planaltina`, `global`)
- `tenant_type` (`global`, `polo`, `enterprise`)
- `user_role` (`aluno`, `instrutor`, `admin`)

---

## 5. Remote Config & Feature Flags

All feature flags are strictly code-authoritative. If Remote Config cannot be fetched, defaults are guaranteed:

| Flag Key | Safe Default | Purpose |
| :--- | :--- | :--- |
| `xara_enabled` | `true` | Public student-facing AI tutor |
| `xara_rag_enabled` | `true` | Academic grounded RAG retrieval |
| `ff_gxeon_command_center_enabled` | `true` | Official GXEON command center route |
| `ff_xara_copilot_enabled` | `true` | Student shell copilot drawer |
| `ff_app_check_enforcement` | `false` | Staged rollout (observe mode only) |
| `ff_push_notifications_enabled` | `false` | FCM notifications disabled until opted-in |
| `ff_ai_logic_enabled` | `false` | Future Genkit adapter dormant; GXEON gateway canonical |
| `maintenance_mode` | `false` | Platform availability switch |

---

## 6. Integration with Authenticated Student Shell

In `apps/web/components/Xpex/XpexAuthenticatedShell.tsx`:
- Fabric is loaded dynamically on client-side mount (`useEffect`).
- Zero blocking on initial render or page load.
- Sets tenant context from the authenticated shell organization context (`organizationSlug`) plus the authorized XPeX role.
- Records initial proof metric: `trackStudentShellLoaded(role)`.

---

## 7. Verification & Quality Gates

1. **Contract Tests (`apps/web/tests/xpex-firebase-fabric.contract.test.mjs`):**
   - 9 / 9 tests passing.
   - Regression test suite: 23 / 23 tests passing.
2. **SSR Safety:** Verified zero `window` / `document` crashes during build or Node execution.
3. **Rollback Safety:** If Firebase is disabled or unreachable, `isFirebaseConfigured()` gracefully degrades all services to safe code defaults with zero student impact.


---

## 8. GX Hardening Audit — 2026-09-24

GX architecture review identified and corrected four pre-merge blockers:

1. **Environment isolation:** removed embedded `xpex-academy-stage` Firebase identifiers from client source. Deployments must now explicitly inject `NEXT_PUBLIC_FIREBASE_*` values, preventing production from silently reporting into staging.
2. **App Check correctness:** removed the synthetic `CustomProvider`/fabricated debug-token path. App Check initializes only when a real reCAPTCHA site key is configured; debug mode uses the official global debug-token mechanism.
3. **Dependency integrity:** restored all pre-existing package overrides that were accidentally dropped while adding Firebase and aligned the declared Firebase Web SDK to the version actually used by the clean staging install.
4. **AI Logic gating:** the dormant Firebase AI Logic adapter now uses `ff_ai_logic_enabled` rather than the broad `beta_features` flag. The default XARA model remains `server-managed` because the live GXEON gateway is canonical.

These corrections preserve Mission 001's non-destructive contract. App Check client initialization status must not be interpreted as Firebase resource enforcement; enforcement is controlled separately by Firebase/backend configuration.
