#!/usr/bin/env bash
set -euo pipefail

# Safe staging deploy wrapper. Defaults to dry-run and never targets production.
ENV_FILE="${ENV_FILE:-.env.staging}"
DRY_RUN="${DRY_RUN:-true}"
IMAGE_TAG="${IMAGE_TAG:-staging-latest}"

"$(dirname "$0")/check-env.sh" "$ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

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
      if [[ "$pair" == *"$candidate"* || "$pair" == *$'\n'* ]]; then
        ok=false
        break
      fi
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
  non_secret_env+=("LEARNHOUSE_S3_API_BUCKET_NAME=${LEARNHOUSE_S3_API_BUCKET_NAME}")
  non_secret_env+=("LEARNHOUSE_S3_API_ENDPOINT_URL=${LEARNHOUSE_S3_API_ENDPOINT_URL}")
fi
encoded_env_vars="$(join_env_vars "${non_secret_env[@]}")"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
cmd=(gcloud run deploy "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --image "$IMAGE" --platform managed --service-account "$CLOUD_RUN_SERVICE_ACCOUNT" --allow-unauthenticated --port 8080 --cpu 2 --memory 2Gi --min-instances 0 --max-instances 5 --concurrency 80 --timeout 900 --cpu-boost --execution-environment gen2 --add-cloudsql-instances "$CLOUD_SQL_INSTANCE" --vpc-connector "$VPC_CONNECTOR" --vpc-egress private-ranges-only --set-env-vars "$encoded_env_vars" --update-secrets "LEARNHOUSE_AUTH_JWT_SECRET_KEY=learnhouse-auth-jwt-secret-key-staging:latest,LEARNHOUSE_SQL_CONNECTION_STRING=learnhouse-sql-connection-string-staging:latest,LEARNHOUSE_REDIS_CONNECTION_STRING=learnhouse-redis-connection-string-staging:latest")

printf 'Prepared Cloud Run staging command:\n%s\n' "${cmd[*]}"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY_RUN=true: no deploy executed. Set DRY_RUN=false only after review."
else
  "${cmd[@]}"
fi
