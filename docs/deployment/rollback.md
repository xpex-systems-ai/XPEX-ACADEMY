# Staging rollback

1. Identify the last healthy Cloud Run revision:
   `gcloud run revisions list --service xpex-academy-staging --region REGION --project PROJECT_ID`.
2. Route 100% traffic to the healthy revision:
   `gcloud run services update-traffic xpex-academy-staging --to-revisions REVISION=100 --region REGION --project PROJECT_ID`.
3. Verify `/api/v1/health` and CORS with `scripts/verify-staging.sh`.
4. Keep the failed revision for log inspection unless it exposes sensitive data.
5. If a secret caused the incident, rotate it in Secret Manager and redeploy staging.

Rollback is limited to staging and must not change production services, production images, or production secrets.
