# GXEON-009 — Staging Plan-Only Activation Audit

Status: **PENDÊNCIA EXTERNA**.

This audit records the local operator evidence for the requested staging plan-only activation. PR #24 was merged on GitHub into `dev` as the official remote merge commit `e7344fea12a7c8ceb573517683d227d2f79b1be1`. This container may synthesize different local object IDs for equivalent content and has no GitHub remote, no `gh` CLI, and no GitHub token. Therefore the external GitHub Environment, Repository Variables, protected Environment variables, manual workflow dispatch, and artifact download cannot be completed from this session.

## Immutable repository context

- Local/synthetic container branch: `work`.
- Local/synthetic container HEAD subject: `Merge pull request #24 from xpex-systems-ai/codex/criar-workflow-manual-de-deploy-para-staging`.
- PR #24 was effectively merged on GitHub into `dev`.
- Official remote merge commit for PR #24 on `dev`: `e7344fea12a7c8ceb573517683d227d2f79b1be1`.
- Approved workflow_dispatch commit SHA: `e7344fea12a7c8ceb573517683d227d2f79b1be1`.
- The approved SHA belongs to the remote `dev` history and is the only SHA authorized for the plan-only dispatch.
- Any local-only/synthetic container SHA must not be used as the workflow_dispatch `commit_sha` input.

## Local verification performed

- Verified the working tree was clean before creating this audit note.
- Verified the current local checkout contains PR #24 content, while the dispatch SHA must remain the official remote merge commit.
- Verified the `Manual staging deploy` workflow exists and supports `workflow_dispatch` with `mode` choices `plan` and `execute`.
- Verified the plan job uploads the redacted artifact named `staging-deploy-plan-redacted`.
- Verified the plan job writes the expected files: `plan.md`, `audit.md`, `preflight.md`, and `config-fingerprint.txt`.
- Verified OIDC is configured for the protected deploy job through `permissions: id-token: write` and `google-github-actions/auth@v2` with `vars.GCP_WORKLOAD_IDENTITY_PROVIDER` and `vars.GCP_DEPLOY_SERVICE_ACCOUNT`.
- Verified no static service-account JSON credential name is referenced by the manual staging deploy workflow.

## External actions still required

1. PR #24 is already merged into `dev` on GitHub as `e7344fea12a7c8ceb573517683d227d2f79b1be1`; do not substitute any local-only SHA for dispatch.
2. Configure the GitHub Environment named `staging`.
3. Register the non-sensitive Repository Variables required by the workflow/runbook:
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
4. Register the protected Environment `staging` variables required for OIDC:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_DEPLOY_SERVICE_ACCOUNT`
5. Confirm that no permanent service-account JSON key or equivalent static cloud credential is present in repository secrets, environment secrets, repository variables, or environment variables.
6. Confirm authentication is exclusively OIDC-based.
7. Manually run the `Manual staging deploy` workflow with:
   - `commit_sha`: `e7344fea12a7c8ceb573517683d227d2f79b1be1`.
   - `mode`: `plan`.
   - `confirmation`: empty.
   - Do not use `mode=execute`.
8. Download and audit the `staging-deploy-plan-redacted` artifact.

## Plan-only audit gates

The first `execute` must remain blocked until a downloaded `staging-deploy-plan-redacted` artifact proves all of the following:

- The run used the approved full SHA from `dev`.
- `plan.md`, `audit.md`, `preflight.md`, and `config-fingerprint.txt` are present.
- The artifact exposes no secrets or permanent credentials.
- The plan recognizes the expected GCP project and Cloud Run service.
- Billing and required APIs are confirmed.
- Existing external infrastructure is confirmed or missing infrastructure is clearly classified.
- A configuration fingerprint is produced.
- The run ends with no build, deployment, traffic update, migration, or other mutation.

## Classification

**PENDÊNCIA EXTERNA** — local repository evidence is ready, but GitHub-side environment configuration, workflow dispatch, and artifact audit require external GitHub access that is not available in this container.
