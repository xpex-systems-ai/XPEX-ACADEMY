# XPeX Firebase Fabric — Vercel Final Gate Handoff

**Mission:** `XPEX-FIREBASE-FABRIC-FOUNDATION-001`  
**PR:** #248  
**Branch:** `feat/firebase-fabric-foundation-v1`  
**Current HEAD:** `a5dc229f084458e638a252f115f114251d9f1534`  
**Owner:** Junior Sena  
**Architect/Auditor:** GX / GXEON  
**Executor target:** Google Antigravity  
**Mode:** FINAL GATE ONLY — NO SCOPE EXPANSION  
**Merge:** FORBIDDEN UNTIL GX FINAL REVIEW

## Current verified state

The Firebase Fabric implementation and GX hardening are complete.

Green GitHub gates on the current head:

- Web Lint — PASS
- Staging build — PASS
- Staging preflight — PASS
- Build Community Images — PASS
- Notify Infrastructure — PASS
- canonical Vercel `xpex-academy` — PASS
- Vercel `xpex-academy-sfh6` — PASS
- Vercel `xpex-academy-536s` — PASS
- Vercel `xpex-academy-3rb4` — PASS

Lockfile recovery is also complete:
- `apps/web/bun.lock` contains Firebase `^12.19.0`;
- `bun install --frozen-lockfile` passed in GitHub Actions;
- all temporary lockfile-sync workflows were removed from the branch.

## Only remaining red gate

GitHub commit status:

`Vercel – xpex-academy-ai = FAILURE`

Target deployment:

`https://vercel.com/gxeon/xpex-academy-ai/721bxSoW1HJTeL8RcRC7FAaQatzQ`

GitHub status description:

`Deployment has failed — run this Vercel CLI command: npx vercel inspect dpl_721bxSoW1HJTeL8RcRC7FAaQatzQ --logs`

GX's connected Vercel scope is `xpex-neural`. The failed deployment belongs to Vercel team/scope `gxeon`, so GX cannot retrieve those logs through the currently connected Vercel connector.

## Executor mission

Use the machine/account context that has access to the Vercel `gxeon` scope.

1. Sync the exact feature branch and verify HEAD.
2. Inspect deployment `dpl_721bxSoW1HJTeL8RcRC7FAaQatzQ`.
3. Capture the exact build failure.
4. Determine whether `xpex-academy-ai` is:
   - an intentional active deployment target for XPeX Academy, or
   - an obsolete/duplicate Vercel project still attached to the GitHub repository.
5. If intentional:
   - fix only the concrete build/deployment blocker;
   - preserve current Firebase architecture;
   - do not weaken security;
   - do not reintroduce hardcoded staging Firebase config;
   - do not expose secrets;
   - redeploy/trigger the check and prove PASS.
6. If obsolete/duplicate:
   - do not delete anything automatically;
   - document the evidence that it is non-canonical and why;
   - identify the exact GitHub/Vercel integration causing the stale status;
   - stop for GX decision before disconnecting/removing the project integration.
7. Re-run or wait for all PR checks.
8. Post evidence to PR #248.
9. STOP.

## Safety invariants

DO NOT:
- merge PR #248;
- alter Auth;
- migrate DB;
- modify Railway;
- rewrite RAG/GXEON;
- enable paid Firebase/GCP resources;
- change unrelated UI;
- weaken CSP or App Check;
- add secrets to the repository;
- remove Vercel projects/integrations without GX review.

## Required final report

Return:

```text
MISSION_STATUS:
VERCEL_PROJECT:
VERCEL_SCOPE:
DEPLOYMENT_ID:
FAILURE_ROOT_CAUSE:
CANONICAL_TARGET:
FIX_APPLIED:
FILES_CHANGED:
NEW_HEAD_SHA:
GITHUB_CHECKS:
VERCEL_STATUS:
PAID_RESOURCES_CREATED:
SECURITY_IMPACT:
ROLLBACK_READY:
MERGE_PERFORMED: false
STOP_CONDITION:
```

## Final directive

This is not a new feature mission.

It is the **last external deployment gate** for `XPEX-FIREBASE-FABRIC-FOUNDATION-001`.

Fix or classify the Vercel failure, provide evidence, and stop.

GX performs the final review and merge decision.
