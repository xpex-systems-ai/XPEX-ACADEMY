# GXEON-009.1 — First Real Staging Plan-Only Audit

Status: **PENDÊNCIA EXTERNA**.

This audit records the execution attempt for mission GXEON-009.1: run the first real `Manual staging deploy` workflow in `plan` mode for commit `e7344fea12a7c8ceb573517683d227d2f79b1be1`, without selecting `execute` and without creating any permanent JSON service-account key.

## Requested immutable inputs

- Target branch for prerequisite merge: `dev`.
- Required PR merge: PR #25.
- Approved `commit_sha`: `e7344fea12a7c8ceb573517683d227d2f79b1be1`.
- Required workflow: `Manual staging deploy`.
- Required `mode`: `plan`.
- Required empty inputs: `confirmation`, `previous_revision`, and `change_ticket`.
- Required artifact: `staging-deploy-plan-redacted`.
- Required artifact files to audit: `plan.md`, `audit.md`, `preflight.md`, and `config-fingerprint.txt`.

## Local repository evidence

- The local checkout already contains a merge commit titled `Merge pull request #25 from xpex-systems-ai/codex/ativar-ambiente-externo-de-staging-em-plan-only`.
- The local checkout has no configured Git remote, no GitHub CLI, and no GitHub token available to this session.
- Because no GitHub API/CLI access exists in this container, the agent cannot prove or modify the real GitHub `dev` branch, GitHub Environments, Repository Variables, Environment Variables, GitHub Actions dispatches, or workflow artifacts.

## GitHub-side actions not completed from this session

1. Merge PR #25 into the real GitHub `dev` branch.
2. Configure the GitHub Environment named `staging`.
3. Register the documented non-sensitive Repository Variables:
   - `GCP_PROJECT_ID`
   - `GCP_REGION`
   - `ARTIFACT_REPOSITORY`
   - `CLOUD_RUN_SERVICE`
   - `CLOUD_RUN_SA`
   - `CLOUD_SQL_INSTANCE`
   - `DB_NAME`
   - `DB_USER`
   - `REDIS_INSTANCE`
   - `VPC_CONNECTOR`
   - `STAGING_BUCKET`
   - `STAGING_API_URL`
   - `STAGING_FRONTEND_ORIGIN`
   - `MAX_INSTANCES`
   - `SECRET_JWT_NAME`
   - `SECRET_SQL_NAME`
   - `SECRET_REDIS_NAME`
4. Register the protected `staging` Environment Variables:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_DEPLOY_SERVICE_ACCOUNT`
5. Confirm that no permanent JSON service-account key was created or registered.
6. Open GitHub Actions and select `Manual staging deploy`.
7. Dispatch only a plan run with:
   - `commit_sha`: `e7344fea12a7c8ceb573517683d227d2f79b1be1`
   - `mode`: `plan`
   - `confirmation`: empty
   - `previous_revision`: empty
   - `change_ticket`: empty
8. Download `staging-deploy-plan-redacted`.
9. Audit `plan.md`, `audit.md`, `preflight.md`, and `config-fingerprint.txt`.

## Audit decision gates

- **GO** only if the real downloaded artifact exists, contains all four required files, contains no secrets, proves the approved SHA, and shows no mutation/build/deploy/traffic update/migration.
- **PENDÊNCIA EXTERNA** if GitHub-side environment configuration, workflow dispatch, or artifact download/audit cannot be performed from the current execution context.
- **NO-GO** if any required variable is missing, any permanent JSON key/static cloud credential is present, `mode=execute` is selected, the SHA differs, required files are missing, secrets are exposed, or the plan indicates unintended mutation.

## Classification

**PENDÊNCIA EXTERNA** — the repository contains the workflow and documentation needed for the requested plan-only run, and the local history shows PR #25 content, but this session lacks the external GitHub access required to merge on GitHub, configure Environment/Variables, dispatch the workflow, download `staging-deploy-plan-redacted`, and audit the artifact files.
