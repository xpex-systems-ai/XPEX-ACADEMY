# HANDOFF 001 — Gemini Core Foundation Hardening

**Mission ID:** XPEX-GEMINI-CORE-001  
**Executor:** Antigravity  
**Architect / auditor:** GXEON  
**Repository:** `xpex-systems-ai/XPEX-ACADEMY`  
**Base branch:** `dev`  
**Target:** PR 01 — Gemini Core Foundation  
**Execution mode:** Audit first, smallest safe change, tests before PR.

---

## 0. Read this first

Before modifying code, read:

1. `docs/gxeon/XPEX_GEMINI_CORE_EXECUTION_MANIFESTO_V1.md`
2. `docs/xpex/google-ai/XPEX_CURRENT_ARCHITECTURE.md`
3. `docs/xpex/google-ai/XPEX_AI_INTEGRATION_MAP.md`
4. `docs/xpex/google-ai/XPEX_IMPLEMENTATION_PLAN.md`
5. `docs/xpex/google-ai/XPEX_RISK_REGISTER.md`
6. `docs/xpex/google-ai/XPEX-GOOGLE-AI-IMPLEMENTATION-HANDOFF.json`

The repository already contains a real AI stack. **Do not build a second AI architecture.**

---

## 1. Repository bootstrap

The repository is already connected to GitHub. Ensure the workspace has the complete repository and is synchronized before editing.

Run the equivalent of:

```bash
git remote -v
git fetch --all --prune
git checkout dev
git pull --ff-only origin dev
git status
```

If the repository is not present locally, clone the complete repository:

```bash
git clone https://github.com/xpex-systems-ai/XPEX-ACADEMY.git
cd XPEX-ACADEMY
git checkout dev
git pull --ff-only origin dev
```

Then create a dedicated feature branch:

```bash
git checkout -b feat/gemini-core-foundation-v1
```

Do not work directly on `dev`.

---

## 2. Current-state facts already confirmed

The current repository is not a blank LMS.

### Existing backend architecture

- FastAPI / Python
- PostgreSQL
- Redis
- Railway production
- multi-tenant organization / Polo model
- RBAC / authentication
- AI credits / plan controls
- durable AI generation history
- RAG
- image/audio/course-planning/quiz/scenario AI services
- asynchronous video jobs
- XPeX editorial/course/video studios

### Existing AI provider layer

Real paths:

- `apps/api/src/services/ai/llm/provider.py`
- `apps/api/src/services/ai/llm/client.py`
- `apps/api/src/services/ai/llm/tiers.py`
- `apps/api/src/services/ai/base.py`
- `apps/api/src/services/ai/rag/`
- `apps/api/src/routers/ai/`

The provider abstraction already supports Google/Gemini through Pydantic AI, plus alternate providers.

### Existing XPeX gateway surface

- `apps/api/src/services/xpex/ai_gateway.py`
- `apps/api/src/routers/xpex.py`

`get_ai_gateway_capabilities()` already returns a secret-free capability snapshot.

The route currently present is:

```
GET /xpex/ai-gateway/health
```

Important audit finding:

The route docstring describes it as authenticated, but the current function signature does not visibly declare the normal authenticated-user dependency. Verify router-level dependencies before changing anything. If no enclosing router dependency protects it, this is a real security/contract mismatch and must be fixed in this PR.

---

## 3. Mission objective

Turn the **existing** AI foundation into a clean, production-safe **Gemini Core / GXEON AI Gateway foundation** without changing the student product yet.

This PR is infrastructure hardening only.

At the end of this PR the system must have a stable, authenticated, secret-free way to answer:

- Is XPeX AI enabled?
- Which provider is configured?
- Which model tiers are selected?
- Which AI capabilities are available?
- Is the Gemini/Google path configured server-side?
- Is video handled asynchronously outside synchronous LLM routes?
- Is the gateway safe to expose to authenticated product surfaces?

No live Gemini generation is required in this PR.

---

## 4. Scope — required work

### A. Audit the existing AI gateway first

Inspect:

- `apps/api/src/services/xpex/ai_gateway.py`
- `apps/api/src/routers/xpex.py`
- `apps/api/src/services/ai/llm/provider.py`
- `apps/api/src/services/ai/llm/client.py`
- `apps/api/src/services/ai/llm/tiers.py`
- current AI configuration model
- current auth dependencies
- existing request/correlation-id middleware, if any
- AI credits / org feature gates
- existing tests for XPeX routers and AI routes

Document findings in the PR body.

### B. Harden the gateway health/capabilities endpoint

Provide a stable API contract for the XPeX AI Gateway health/capability snapshot.

Requirements:

1. Must require authentication unless a stronger router-level auth guarantee already exists.
2. Must never expose API keys, tokens, raw secret config, provider headers or credential-derived values.
3. Must not perform a paid provider call just to report health.
4. Must preserve provider abstraction.
5. Must expose model tiers centrally rather than hard-coding model IDs inside the route.
6. Must report disabled/unconfigured state safely.
7. Must keep video generation explicitly asynchronous / outside the synchronous LLM gateway.
8. Must not require a database migration.

Prefer a typed response model if that matches repository conventions.

### C. Gemini Core configuration boundary

Confirm and preserve this hierarchy:

```
product feature
  → GXEON/XPeX orchestration
  → services/ai provider-neutral layer
  → Google/Gemini provider adapter
```

Do not call a Google SDK directly from product/business code if the existing provider abstraction can serve the use case.

Consumer Google AI Pro access must remain conceptually separate from production API credentials/quota.

### D. Correlation / observability audit

Audit whether requests already receive a request/correlation ID.

- If a production-grade request ID already exists, reuse it and document it.
- If none exists, add only the smallest bounded mechanism necessary for **new XPeX AI gateway surfaces**, not a risky global middleware rewrite.
- Never log credentials or full private document contents.

This PR must not create a large observability subsystem.

### E. Tests

Add/extend tests covering the gateway contract.

Minimum required scenarios:

1. unauthenticated request is rejected when auth is required;
2. authenticated request receives a valid capability response;
3. response contains no secret fields;
4. disabled AI returns a safe disabled state;
5. Google/Gemini aliases resolve through the existing provider model;
6. health/capability inspection makes no external provider generation call;
7. current unrelated AI routes remain compatible.

Use mocks/config fixtures. CI must not require a real Gemini key.

---

## 5. Explicit non-goals

Do **not** implement in this PR:

- GX Tutor UI;
- new RAG ingestion;
- learning-path recommendation;
- Course Studio generation changes;
- video generation;
- Cenara integration;
- Flow/Veo integration;
- Google Drive ingestion;
- Agent Studio;
- AI Lab redesign;
- billing purchase flows;
- destructive schema migrations;
- framework upgrades;
- new parallel authorization model;
- a second AI provider abstraction.

Those belong to later PRs.

---

## 6. Security invariants

The PR must preserve:

- organization/Polo tenancy;
- existing RBAC;
- server-side provider secrets only;
- no secret under `NEXT_PUBLIC_*`;
- no cross-org data access;
- no unauthenticated paid AI generation;
- no AI quota bypass;
- no raw exception/provider payload with secrets returned to the browser.

Do not weaken existing auth to make tests pass.

---

## 7. UX / product impact

No major UI redesign in this PR.

A future frontend should be able to consume the capability endpoint, but this PR is primarily backend foundation.

If a frontend type/service already maps XPeX gateway capabilities and a tiny compatibility update is required, keep it minimal and explain why.

---

## 8. Acceptance criteria

The PR is acceptable only if all are true:

- existing AI architecture is reused, not duplicated;
- health/capability endpoint has a stable contract;
- auth status is unambiguous and tested;
- no provider secret can appear in response payload;
- no live/payed provider call is needed for the health endpoint;
- Google/Gemini remains behind the provider abstraction;
- model tiers remain centralized;
- CI passes;
- no migration is introduced;
- no LMS behavior regresses;
- no student-facing AI behavior changes yet;
- documentation reflects the actual implementation.

---

## 9. Suggested files to inspect first

```
apps/api/src/services/xpex/ai_gateway.py
apps/api/src/routers/xpex.py
apps/api/src/services/ai/llm/provider.py
apps/api/src/services/ai/llm/client.py
apps/api/src/services/ai/llm/tiers.py
apps/api/src/services/ai/base.py
apps/api/src/routers/orgs/ai_credits.py
apps/api/src/tests/
apps/api/config/config.py
```

Do not assume these are the only files. Audit before editing.

---

## 10. Required validation commands

Determine exact project commands from repository configuration.

At minimum run the relevant equivalents of:

```
# backend unit/security tests touching AI + XPeX gateway
pytest <targeted tests>

# formatting/lint/type checks required by repository CI
<repo-native lint/type commands>

# existing security or contract tests materially related to changed files
<repo-native targeted security tests>
```

Do not disable or skip a failing relevant test without explaining it.

---

## 11. PR requirements

Open exactly one implementation PR from:

```
feat/gemini-core-foundation-v1
```

to:

```
dev
```

Suggested PR title:

```
feat(gxeon): harden Gemini Core AI gateway foundation
```

PR body must contain:

### Current state
What already existed.

### Changes
Exactly what the PR changes.

### Security
Auth, secrets, tenancy and billing implications.

### Tests
Commands run + results.

### Non-goals
What was intentionally not included.

### Risks
Any remaining risks.

### Rollback
How to revert safely.

### Evidence
Relevant test/CI output.

---

## 12. Stop condition

After opening the PR:

**STOP. DO NOT MERGE IT.**

Return:

- PR number;
- PR URL;
- head commit SHA;
- changed files;
- test results;
- concise architecture findings;
- any unresolved risks.

GX/GXEON will audit the diff and decide whether corrections are required before merge.

---

## 13. Next mission after acceptance

Only after PR 01 passes audit and production smoke verification will we start:

**PR 02 — GX Tutor Real**

That mission will connect the existing student “Open GX” experience to authorized lesson/course context, RAG, Gemini streaming and usage tracking.

---

## Final directive

**PRESERVE → AUDIT → INTEGRATE → TEST → OPEN PR → STOP**

Do not rebuild XPeX.

Do not treat Gemini as a separate application.

Make the existing XPeX intelligence layer production-grade enough to become the Gemini Core foundation.
