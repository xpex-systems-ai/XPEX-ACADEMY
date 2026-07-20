# Cloud Run staging

Use `scripts/deploy-staging.sh --dry-run --env-file .env.staging.example` to render the approved staging build and deploy commands before any manual execution. The script uses `cloudbuild.yaml` for the image build and deploys `apps/api/Dockerfile` to Cloud Run with Secret Manager references only.

Do not run a real deploy until billing, IAM, Cloud SQL, Redis, bucket, secrets, and domain are approved by the owner.
