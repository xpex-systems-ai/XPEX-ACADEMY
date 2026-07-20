# Cloud Run staging rollback

Rollback is revision-based. List revisions, choose the last known-good revision, and move 100% of traffic back to it.

```bash
gcloud run revisions list --service <CLOUD_RUN_SERVICE> --region <GCP_REGION>
gcloud run services update-traffic <CLOUD_RUN_SERVICE> --region <GCP_REGION> --to-revisions <PREVIOUS_REVISION>=100
scripts/verify-staging.sh <STAGING_API_URL>
```
