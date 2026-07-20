# Staging operations

Routine checks:

```bash
scripts/check-env.sh .env.staging.example
scripts/deploy-staging.sh --dry-run --env-file .env.staging.example
gcloud run services logs read <CLOUD_RUN_SERVICE> --region <GCP_REGION> --limit 100
scripts/verify-staging.sh <STAGING_API_URL>
```

Keep all real secret values in Secret Manager; this repository stores only placeholders and secret resource names.
