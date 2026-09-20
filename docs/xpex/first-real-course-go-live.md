# XPeX Academy — First Real Course Go-Live Gate

This document defines the minimum evidence required before opening the first
course to real students. It complements the Learning Operating System roadmap
with an operational launch gate.

## Decision model

- **NO-GO** — any P0 blocker remains.
- **PILOT ONLY** — P0 is green, but one or more P1 items remain.
- **READY** — P0 and P1 are green and the manual E2E has been completed.

## Automated preflight

Run inside the same production image/environment used by Railway:

```bash
cd /app/api
PYTHONPATH=/app/api .venv/bin/python scripts/xpex_go_live_preflight.py
```

If GX/RAG is part of the launch promise:

```bash
PYTHONPATH=/app/api .venv/bin/python scripts/xpex_go_live_preflight.py --require-ai
```

If paid checkout is part of the first launch:

```bash
PYTHONPATH=/app/api .venv/bin/python scripts/xpex_go_live_preflight.py --require-payments
```

The command is read-only. It never prints secret values and delegates course /
assessment readiness to the existing dry-run scripts.

## P0 — blocks real students

1. Production mode enabled; development mode disabled.
2. Strong JWT secret configured outside Git.
3. PostgreSQL and Redis configured and reachable.
4. Assessment schema readiness passes.
5. First-student flow dry-run passes.
6. Login, logout, refresh and password recovery work in production.
7. Transactional email sender and provider are configured.
8. Tenant/RBAC isolation is verified:
   - student cannot access admin routes;
   - student A cannot access student B data;
   - one Polo cannot read another Polo data.
9. Course, lesson/player, progress and assessment persist after logout/login.
10. No critical 5xx exists in the launch path.

## P1 — required before public launch

1. Official domain + HTTPS + correct cookie behavior.
2. Backup policy documented and a restore tested in an isolated environment.
3. Course media has no broken required video/file/thumbnail.
4. Loading/error/empty states are controlled on desktop and mobile.
5. Certificate completion path is verified with correct student/course/date.
6. Support/recovery path exists for locked-out students.
7. Observability is enabled for API/web errors and deployment health.
8. Unrelated experimental startup jobs are reviewed before scale.

## AI gate

AI is not a blocker for the academic launch unless the launch promise includes
GX/RAG. When advertised as operational, verify:

```text
student -> authorized course context -> RAG retrieval -> model -> grounded answer
```

Also verify quota, timeout, fallback, cost controls and that content from another
tenant/course cannot be retrieved.

## Payment gate

Payments are not a blocker for a manually enrolled pilot. If the first launch
uses paid checkout, verify the complete financial E2E separately:

```text
offer -> checkout -> provider confirmation -> signed webhook -> idempotent
enrollment -> reconciliation -> cancellation/refund behavior
```

Never mark payment ready because credentials or legacy routes merely exist.

## Manual E2E — XPEX FIRST REAL STUDENT

The release owner must capture evidence for all fifteen steps:

1. Professor/admin can access the intended Polo.
2. Official course is published and visible only where expected.
3. A controlled new student receives/uses the intended onboarding path.
4. Student logs in successfully.
5. Enrollment places the expected course in the student dashboard.
6. First lesson opens.
7. Required video/media loads successfully.
8. Course material opens/downloads where applicable.
9. Progress is recorded.
10. Assessment can be submitted and graded according to the configured rule.
11. Course completion is computed correctly.
12. Certificate is generated only when completion criteria are satisfied.
13. Logout/login preserves enrollment, progress and completion state.
14. Authorization-negative tests fail safely (403/404 without data leakage).
15. Launch-window logs show no critical 5xx or repeated broken required assets.

## First launch scope

For the first real cohort, prefer a small controlled pilot. The launch does not
need to wait for marketplace, Agent Economy, all AI Studios or automated paid
checkout unless those capabilities are explicitly part of the offer.

Minimum product promise:

> **Entrar -> aprender -> concluir -> progresso persistido -> resultado comprovável.**

## Evidence record

For each launch candidate, record:

- deployment identifier;
- commit SHA;
- course UUID/slug (non-secret);
- organization/Polo slug;
- automated preflight result;
- manual E2E date;
- P0/P1/P2 findings;
- GO / PILOT ONLY / NO-GO decision;
- rollback owner and rollback path.

No credentials, tokens or learner PII belong in the evidence record.
