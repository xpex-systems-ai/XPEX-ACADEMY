#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.staging}"
DRY_RUN="${DRY_RUN:-true}"
IMAGE_TAG="${IMAGE_TAG:-staging-latest}"

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-staging.sh [--dry-run] [--env-file .env.staging]

Defaults to --dry-run. Set DRY_RUN=false in the environment only after an
approved GO/NO-GO review to execute the Cloud Run deploy command.
USAGE
}

while (($#)); do
  case "$1" in
    --dry-run) DRY_RUN="true"; shift ;;
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

"$(dirname "$0")/check-env.sh" "$ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"
REGION="${GCP_REGION:-${REGION:-}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-${SERVICE_NAME:-}}"
CLOUD_RUN_SERVICE_ACCOUNT="${CLOUD_RUN_SA:-${CLOUD_RUN_SERVICE_ACCOUNT:-}}"
BUCKET="${STAGING_BUCKET:-${GCS_BUCKET:-${LEARNHOUSE_S3_API_BUCKET_NAME:-}}}"
MAX_INSTANCES="${MAX_INSTANCES:-5}"

if [[ -z "$IMAGE_TAG" || "$IMAGE_TAG" == *:* ]]; then
  echo "IMAGE_TAG must be non-empty and must not contain ':'." >&2
  exit 1
fi
if [[ "${SERVICE_NAME}" == *prod* || "${PROJECT_ID}" == *prod* || "${LEARNHOUSE_ENV}" != "staging" ]]; then
  echo "Refusing non-staging deploy target: PROJECT_ID=$PROJECT_ID SERVICE_NAME=$SERVICE_NAME LEARNHOUSE_ENV=$LEARNHOUSE_ENV" >&2
  exit 1
fi

join_env_vars() {
  local delimiter="@"
  local candidates=("@" "|" "~" "%" ";")
  local pairs=("$@")
  local candidate pair
  for candidate in "${candidates[@]}"; do
    local ok=true
    for pair in "${pairs[@]}"; do
      if [[ "$pair" == *"$candidate"* || "$pair" == *$'\n'* ]]; then ok=false; break; fi
    done
    if [[ "$ok" == true ]]; then
      delimiter="$candidate"
      printf '^%s^%s\n' "$delimiter" "$(IFS="$delimiter"; echo "${pairs[*]}")"
      return 0
    fi
  done
  echo "Could not safely encode Cloud Run env vars; unsupported delimiter in values." >&2
  return 1
}

non_secret_env=(
  "LEARNHOUSE_SITE_NAME=${LEARNHOUSE_SITE_NAME}"
  "LEARNHOUSE_SITE_DESCRIPTION=${LEARNHOUSE_SITE_DESCRIPTION}"
  "LEARNHOUSE_CONTACT_EMAIL=${LEARNHOUSE_CONTACT_EMAIL}"
  "LEARNHOUSE_ENV=${LEARNHOUSE_ENV}"
  "LEARNHOUSE_DEVELOPMENT_MODE=${LEARNHOUSE_DEVELOPMENT_MODE}"
  "LEARNHOUSE_TENANCY=${LEARNHOUSE_TENANCY}"
  "LEARNHOUSE_DOMAIN=${LEARNHOUSE_DOMAIN}"
  "LEARNHOUSE_FRONTEND_DOMAIN=${LEARNHOUSE_FRONTEND_DOMAIN}"
  "LEARNHOUSE_ALLOWED_ORIGINS=${LEARNHOUSE_ALLOWED_ORIGINS}"
  "LEARNHOUSE_SSL=${LEARNHOUSE_SSL}"
  "LEARNHOUSE_CONTENT_DELIVERY_TYPE=${LEARNHOUSE_CONTENT_DELIVERY_TYPE}"
  "LEARNHOUSE_IS_AI_ENABLED=${LEARNHOUSE_IS_AI_ENABLED}"
  "LEARNHOUSE_PORT=8080"
)
[[ -n "${LEARNHOUSE_ALLOWED_REGEXP:-}" ]] && non_secret_env+=("LEARNHOUSE_ALLOWED_REGEXP=${LEARNHOUSE_ALLOWED_REGEXP}")
if [[ "${LEARNHOUSE_CONTENT_DELIVERY_TYPE}" == "s3api" ]]; then
  non_secret_env+=("LEARNHOUSE_S3_API_BUCKET_NAME=${LEARNHOUSE_S3_API_BUCKET_NAME:-$BUCKET}")
  non_secret_env+=("LEARNHOUSE_S3_API_ENDPOINT_URL=${LEARNHOUSE_S3_API_ENDPOINT_URL}")
fi
encoded_env_vars="$(join_env_vars "${non_secret_env[@]}")"

SECRET_JWT_NAME="${SECRET_JWT_NAME:-learnhouse-auth-jwt-secret-key-staging}"
SECRET_SQL_NAME="${SECRET_SQL_NAME:-learnhouse-sql-connection-string-staging}"
SECRET_REDIS_NAME="${SECRET_REDIS_NAME:-learnhouse-redis-connection-string-staging}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
build_cmd=(gcloud builds submit --project "$PROJECT_ID" --config cloudbuild.yaml --substitutions "_REGION=$REGION,_ARTIFACT_REPOSITORY=$ARTIFACT_REPOSITORY,_IMAGE_NAME=$IMAGE_NAME,_IMAGE_TAG=$IMAGE_TAG")
deploy_cmd=(gcloud run deploy "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --image "$IMAGE" --platform managed --service-account "$CLOUD_RUN_SERVICE_ACCOUNT" --allow-unauthenticated --port 8080 --cpu 2 --memory 2Gi --min-instances 0 --max-instances "$MAX_INSTANCES" --concurrency 80 --timeout 900 --cpu-boost --execution-environment gen2 --add-cloudsql-instances "$CLOUD_SQL_INSTANCE" --vpc-connector "$VPC_CONNECTOR" --vpc-egress private-ranges-only --set-env-vars "$encoded_env_vars" --update-secrets "LEARNHOUSE_AUTH_JWT_SECRET_KEY=${SECRET_JWT_NAME}:latest,LEARNHOUSE_SQL_CONNECTION_STRING=${SECRET_SQL_NAME}:latest,LEARNHOUSE_REDIS_CONNECTION_STRING=${SECRET_REDIS_NAME}:latest")
verify_cmd=(scripts/verify-staging.sh "${STAGING_API_URL:-https://${LEARNHOUSE_DOMAIN}}")
rollback_cmd=(gcloud run services update-traffic "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --to-revisions "PREVIOUS_REVISION=100")

cat <<PLAN
Staging deploy plan (secrets redacted):
- Image: $IMAGE
- Artifact Registry: $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPOSITORY
- Cloud Run service: $SERVICE_NAME
- Region: $REGION
- Service account: $CLOUD_RUN_SERVICE_ACCOUNT
- Cloud SQL instance: $CLOUD_SQL_INSTANCE
- VPC connector: $VPC_CONNECTOR
- Bucket: $BUCKET
- Non-secret env vars:
$(printf '  - %s\n' "${non_secret_env[@]}")
- Secret Manager names only:
  - LEARNHOUSE_AUTH_JWT_SECRET_KEY=$SECRET_JWT_NAME:latest
  - LEARNHOUSE_SQL_CONNECTION_STRING=$SECRET_SQL_NAME:latest
  - LEARNHOUSE_REDIS_CONNECTION_STRING=$SECRET_REDIS_NAME:latest
- Build command: ${build_cmd[*]}
- Deploy command: ${deploy_cmd[*]}
- Verify command: ${verify_cmd[*]}
- Rollback command: ${rollback_cmd[*]}
PLAN

if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY_RUN=true: no build, deploy, verify, rollback, or resource creation was executed."
else
  "${deploy_cmd[@]}"
fi
