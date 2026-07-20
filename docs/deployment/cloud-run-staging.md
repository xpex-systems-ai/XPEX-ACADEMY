# Cloud Run staging architecture

This staging plan is build-first and deployment-gated. It prepares a reproducible Google Cloud Run target without touching production.

## Components

- **Cloud Run service:** `xpex-academy-staging`, Gen2, port `8080`, min instances `0`, max instances `5`.
- **Artifact Registry:** Docker repository `xpex-academy-staging` containing `xpex-academy-api:<sha>` and `staging-latest`.
- **Cloud Build:** `cloudbuild.yaml` builds and validates the image only; it does not deploy.
- **Secret Manager:** all credentials are injected by name at deploy time; no real secrets are stored in git.
- **Cloud SQL PostgreSQL:** private Cloud SQL instance mounted with `--add-cloudsql-instances`; connection string should use `/cloudsql/...`.
- **Redis / Memorystore:** private IP accessed through the staging VPC connector.
- **Persistent storage:** Cloud Storage bucket configured through the existing S3 API-compatible content delivery settings.
- **Health checks:** Docker healthcheck and external `/api/v1/health` verification.
- **Logs and monitoring:** Cloud Run request logs, application stdout/stderr, Cloud Build logs, uptime alerting on health endpoint, and error reporting through Sentry when configured.

## Non-production guardrails

- Use a dedicated staging project or clearly separated staging resources.
- Keep `LEARNHOUSE_ENV=staging` and `LEARNHOUSE_DEVELOPMENT_MODE=false`.
- Run `scripts/deploy-staging.sh` in dry-run mode first; it refuses obvious production-like service names.
- Do not merge or deploy from this preparation branch until the checklist is complete.
