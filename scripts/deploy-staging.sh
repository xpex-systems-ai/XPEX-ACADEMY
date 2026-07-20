#!/usr/bin/env bash
set -euo pipefail
DRY_RUN=false
ENV_FILE=".env.staging.example"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --env-file) ENV_FILE="$2"; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
  shift
done
# shellcheck disable=SC1090
source "$ENV_FILE"
IMAGE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REPOSITORY}/xpex-academy-api:${GIT_SHA:-staging-manual}"
commands=(
  "gcloud builds submit apps/api --config cloudbuild.yaml --substitutions _REGION=${GCP_REGION},_REPOSITORY=${ARTIFACT_REPOSITORY},_IMAGE=xpex-academy-api,_TAG=${GIT_SHA:-staging-manual}"
  "gcloud run deploy ${CLOUD_RUN_SERVICE} --image ${IMAGE} --region ${GCP_REGION} --platform managed --service-account ${CLOUD_RUN_SERVICE_ACCOUNT} --port 8080 --min-instances 0 --set-env-vars LEARNHOUSE_ENV=staging,LEARNHOUSE_DEVELOPMENT_MODE=false,LEARNHOUSE_TENANCY=${LEARNHOUSE_TENANCY},LEARNHOUSE_DOMAIN=${LEARNHOUSE_DOMAIN},LEARNHOUSE_FRONTEND_DOMAIN=${LEARNHOUSE_FRONTEND_DOMAIN},LEARNHOUSE_SSL=${LEARNHOUSE_SSL},LEARNHOUSE_CONTENT_DELIVERY_TYPE=${LEARNHOUSE_CONTENT_DELIVERY_TYPE},LEARNHOUSE_S3_API_BUCKET_NAME=${LEARNHOUSE_S3_API_BUCKET_NAME} --set-secrets LEARNHOUSE_AUTH_JWT_SECRET_KEY=${LEARNHOUSE_AUTH_JWT_SECRET_KEY_SECRET}:latest,LEARNHOUSE_SQL_CONNECTION_STRING=${LEARNHOUSE_SQL_CONNECTION_STRING_SECRET}:latest,LEARNHOUSE_REDIS_CONNECTION_STRING=${LEARNHOUSE_REDIS_CONNECTION_STRING_SECRET}:latest"
)
for cmd in "${commands[@]}"; do
  if [[ "$DRY_RUN" == true ]]; then printf '[dry-run] %s\n' "$cmd"; else eval "$cmd"; fi
done
