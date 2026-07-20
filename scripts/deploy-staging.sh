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

if [[ "${SERVICE_NAME}" == *prod* || "${LEARNHOUSE_ENV}" != "staging" ]]; then
  echo "Refusing non-staging deploy target: SERVICE_NAME=$SERVICE_NAME LEARNHOUSE_ENV=$LEARNHOUSE_ENV" >&2
  exit 1
fi

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
cmd=(gcloud run deploy "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --image "$IMAGE" --platform managed --service-account "$CLOUD_RUN_SERVICE_ACCOUNT" --allow-unauthenticated --port 8080 --cpu 2 --memory 2Gi --min-instances 0 --max-instances 5 --concurrency 80 --timeout 900 --cpu-boost --execution-environment gen2 --add-cloudsql-instances "$CLOUD_SQL_INSTANCE" --vpc-connector "$VPC_CONNECTOR" --vpc-egress private-ranges-only --set-env-vars "LEARNHOUSE_ENV=staging,LEARNHOUSE_DEVELOPMENT_MODE=false,LEARNHOUSE_PORT=8080" --update-secrets "LEARNHOUSE_AUTH_JWT_SECRET_KEY=learnhouse-auth-jwt-secret-key-staging:latest,LEARNHOUSE_SQL_CONNECTION_STRING=learnhouse-sql-connection-string-staging:latest,LEARNHOUSE_REDIS_CONNECTION_STRING=learnhouse-redis-connection-string-staging:latest")

printf 'Prepared Cloud Run staging command:\n%s\n' "${cmd[*]}"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY_RUN=true: no deploy executed. Set DRY_RUN=false only after review."
else
  "${cmd[@]}"
fi
