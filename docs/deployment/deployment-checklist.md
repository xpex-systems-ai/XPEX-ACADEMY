# Staging deployment checklist

- [ ] Confirm branch and PR approval.
- [ ] Confirm GCP project, region, billing, IAM, Cloud SQL, Redis, bucket, secrets, and domain.
- [ ] Run `scripts/check-env.sh .env.staging.example` against a placeholder/example file.
- [ ] Run `scripts/deploy-staging.sh --dry-run --env-file .env.staging.example` and review commands.
- [ ] Execute Alembic migrations manually against staging before shifting traffic.
- [ ] Verify `GET /api/v1/health` with `scripts/verify-staging.sh <STAGING_API_URL>` after deploy.
- [ ] Keep rollback revision identified before any traffic changes.
