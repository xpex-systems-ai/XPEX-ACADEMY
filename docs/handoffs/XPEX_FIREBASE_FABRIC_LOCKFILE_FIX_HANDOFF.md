# XPeX Firebase Fabric — Lockfile Recovery Handoff

**Mission:** `XPEX-FIREBASE-FABRIC-FOUNDATION-001`  
**PR:** #248  
**Branch:** `feat/firebase-fabric-foundation-v1`  
**Owner:** Junior Sena  
**Architect/Auditor:** GX / GXEON  
**Executor target:** Codex or Google Antigravity  
**Status:** BLOCKED ONLY BY LOCKFILE SYNC

## Current state

GX already audited and hardened the branch.

Applied corrections:
- removed hardcoded staging Firebase identifiers from client source;
- removed synthetic App Check token generation;
- restored package overrides accidentally removed;
- aligned declared Firebase SDK with current official major;
- isolated dormant Firebase AI Logic behind `ff_ai_logic_enabled`;
- kept XARA model selection server-managed;
- removed unrelated GXEON chat-shell change;
- expanded Firebase Fabric contract tests.

## Remaining blocker

GitHub Actions fails at dependency installation:

```
bun install --frozen-lockfile
error: lockfile had changes, but lockfile is frozen
```

Cause:
`apps/web/package.json` contains Firebase but `apps/web/bun.lock` has not been regenerated.

## Required execution

```bash
git fetch origin
git checkout feat/firebase-fabric-foundation-v1
git pull --ff-only origin feat/firebase-fabric-foundation-v1

cd apps/web
bun install

git status
git diff -- package.json bun.lock

git add package.json bun.lock
git commit -m "chore(firebase): sync bun lockfile"
git push origin feat/firebase-fabric-foundation-v1
```

## Verification after push

Run locally before or after push:

```bash
bun install --frozen-lockfile
node --test tests/xpex-firebase-fabric.contract.test.mjs
node --test tests/xpex-gxeon-command-center.contract.test.mjs
node --test tests/xpex-ai-lab-studio.contract.test.mjs
node --test tests/xpex-ai-lab-projects.contract.test.mjs
npx tsc --noEmit
npx eslint lib/firebase components/Xpex/XpexAuthenticatedShell.tsx
npm run build
```

## CI gate

After the push, wait for GitHub checks.

Required outcome:
- Web Lint: PASS
- Staging build: PASS
- Staging preflight: PASS
- Build Community Images: PASS or existing accepted behavior
- Vercel required deployments: PASS
- no new failing required check attributable to this PR

## Do not do

- do not merge PR #248;
- do not modify auth;
- do not migrate database;
- do not touch Railway;
- do not enable paid Firebase/GCP resources;
- do not rewrite RAG/GXEON;
- do not change unrelated UI;
- do not regenerate lockfile with a different package manager.

## Stop condition

Once lockfile is committed, CI is green, and evidence is posted to PR #248:

**STOP.**

GX performs final architectural audit and decides whether merge is authorized.
