# Staging deployment checklist

## Before build

- [ ] Dedicated staging Google Cloud project or resource prefix exists.
- [ ] Artifact Registry repository exists in the selected region.
- [ ] Cloud Build service account can write to Artifact Registry.
- [ ] Cloud Run runtime service account exists with least-privilege IAM.
- [ ] Cloud SQL PostgreSQL instance and database exist.
- [ ] Memorystore Redis instance exists on the same VPC.
- [ ] Serverless VPC Access connector exists.
- [ ] Cloud Storage bucket exists and is not public.
- [ ] Secret Manager contains all required staging secrets.
- [ ] `.env.staging` passes `scripts/check-env.sh` locally.

## Validation

- [ ] `uv sync --frozen` succeeds in `apps/api`.
- [ ] `import app` succeeds with staging-safe environment variables.
- [ ] `import numpy` succeeds.
- [ ] Docker image builds from `apps/api/Dockerfile`.
- [ ] Docker healthcheck passes against the running container.
- [ ] CORS preflight only allows the staging frontend origin.
- [ ] Cloud Run deploy command is reviewed in dry-run mode.

## After deploy window approval

- [ ] Deploy only to the staging service.
- [ ] Run `scripts/verify-staging.sh` against the generated URL.
- [ ] Confirm Cloud Run logs contain no secret values.
- [ ] Confirm Cloud SQL and Redis connectivity from health and application logs.
- [ ] Configure uptime check and alerting policy.
