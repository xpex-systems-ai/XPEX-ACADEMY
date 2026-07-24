# Staging GitHub Environment setup

This configuration is external to the repository. The workflow declares `environment: staging` only on the mutable deploy job, but it cannot create or prove GitHub required reviewers by code.

## Repository Variables for read-only `plan`

Repository Variables contain only non-sensitive metadata needed to render and audit the plan without OIDC or deploy approval: `GCP_PROJECT_ID`, `GCP_REGION`, `ARTIFACT_REPOSITORY`, `CLOUD_RUN_SERVICE`, `CLOUD_RUN_SA`, `CLOUD_SQL_INSTANCE`, `DB_NAME`, `DB_USER`, `REDIS_INSTANCE`, `VPC_CONNECTOR`, `STAGING_BUCKET`, `STAGING_API_URL`, `STAGING_FRONTEND_ORIGIN`, `MAX_INSTANCES`, `SECRET_JWT_NAME`, `SECRET_SQL_NAME`, and `SECRET_REDIS_NAME`.

Only Secret Manager secret names are allowed in `SECRET_*_NAME`; secret values, connection strings, JSON keys, and tokens are forbidden in Repository Variables.

## Environment `staging` Variables for protected `execute`

The GitHub Environment `staging` must provide protected execution-only variables for OIDC and deployment: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, and staging-specific values required by the deploy job. Keep values exclusive to staging and aligned with the Repository Variables reviewed in plan mode.

## Required external controls

| Item | Required state | Classification |
| --- | --- | --- |
| GitHub Environment `staging` | Exists before execute mode is used. | PENDÊNCIA EXTERNA |
| Required reviewer | At least one human operations reviewer. | PENDÊNCIA EXTERNA |
| Prevent self-review | Enabled when the repository plan supports it. | PENDÊNCIA EXTERNA |
| Deployment branch policy | Restricted to `dev` and approved deploy branches only; never `main`, `prod`, or `production`. | PENDÊNCIA EXTERNA |
| Bypass | Environment bypass disabled for normal operators. | PENDÊNCIA EXTERNA |
| Approval record | GitHub deployment approval retained in the run audit log. | GO after configuration |
| Workload Identity Provider | `GCP_WORKLOAD_IDENTITY_PROVIDER` environment variable points to the approved provider. | PENDÊNCIA EXTERNA |
| Deploy service account | `GCP_DEPLOY_SERVICE_ACCOUNT` is staging-only and least privilege. | PENDÊNCIA EXTERNA |
| IAM bindings | Minimal Cloud Run deploy, Cloud Build/Artifact Registry use, read-only audit, and runtime service account checks. | PENDÊNCIA EXTERNA |
| Repository Variables | Non-sensitive plan metadata only. | PENDÊNCIA EXTERNA |
| Environment Variables | Protected staging execution metadata and OIDC identifiers. | PENDÊNCIA EXTERNA |
| Secret names | Store only Secret Manager resource names in variables: `SECRET_JWT_NAME`, `SECRET_SQL_NAME`, `SECRET_REDIS_NAME`. | GO when names only |
| Secret values | Never place secret values, JSON keys, tokens, or connection strings in GitHub variables, repository files, or logs. | NO-GO if present |
| Budget | Staging budget and billing alert exist before execute. | PENDÊNCIA EXTERNA |
| Alerts | Cloud Run error, billing, and availability alerts route to the responsible operator. | PENDÊNCIA EXTERNA |
| Operational owner | Named human owner approves `change_ticket` before execute. | PENDÊNCIA EXTERNA |
