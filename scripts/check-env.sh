#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.staging}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.staging.example and fill non-secret metadata." >&2
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
    echo "Refusing to use tracked secret file: $ENV_FILE must never be committed." >&2
    exit 1
  fi
  if [[ "$(basename "$ENV_FILE")" == ".env.staging" ]] && ! git check-ignore -q "$ENV_FILE"; then
    echo "Refusing to use $ENV_FILE because it is not ignored by Git." >&2
    exit 1
  fi
fi

if ! command -v grep >/dev/null 2>&1; then
  echo "Required tool missing: grep." >&2
  exit 1
fi
if grep -Enq "REPLACE_WITH_SECRET_MANAGER_VALUE" "$ENV_FILE"; then
  echo "Variables still use placeholders in $ENV_FILE." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Public staging variables use the GCP_/CLOUD_RUN_/STAGING_ names. Keep
# backward compatibility by normalizing them to the legacy internal names before
# validation.
PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"
REGION="${GCP_REGION:-${REGION:-}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-${SERVICE_NAME:-}}"
CLOUD_RUN_SERVICE_ACCOUNT="${CLOUD_RUN_SA:-${CLOUD_RUN_SERVICE_ACCOUNT:-}}"
GCS_BUCKET="${STAGING_BUCKET:-${GCS_BUCKET:-${LEARNHOUSE_S3_API_BUCKET_NAME:-}}}"

required=(PROJECT_ID REGION ARTIFACT_REPOSITORY SERVICE_NAME IMAGE_NAME CLOUD_RUN_SERVICE_ACCOUNT CLOUD_SQL_INSTANCE VPC_CONNECTOR GCS_BUCKET LEARNHOUSE_SITE_NAME LEARNHOUSE_SITE_DESCRIPTION LEARNHOUSE_CONTACT_EMAIL LEARNHOUSE_ENV LEARNHOUSE_DEVELOPMENT_MODE LEARNHOUSE_TENANCY LEARNHOUSE_DOMAIN LEARNHOUSE_FRONTEND_DOMAIN LEARNHOUSE_ALLOWED_ORIGINS LEARNHOUSE_SSL LEARNHOUSE_CONTENT_DELIVERY_TYPE LEARNHOUSE_IS_AI_ENABLED)
secret_required=(LEARNHOUSE_AUTH_JWT_SECRET_KEY LEARNHOUSE_SQL_CONNECTION_STRING LEARNHOUSE_REDIS_CONNECTION_STRING)
missing=()
placeholder=()
for name in "${required[@]}" "${secret_required[@]}"; do
  value="${!name:-}"
  [[ -n "$value" ]] || missing+=("$name")
  [[ "$value" != *REPLACE_WITH_SECRET_MANAGER_VALUE* ]] || placeholder+=("$name")
done

if (( ${#missing[@]} > 0 )); then
  printf 'Missing required variables: %s\n' "${missing[*]}" >&2
  exit 1
fi
if (( ${#placeholder[@]} > 0 )); then
  printf 'Variables still use placeholders: %s\n' "${placeholder[*]}" >&2
  exit 1
fi

if [[ "${LEARNHOUSE_ENV}" != "staging" ]]; then
  echo "LEARNHOUSE_ENV must be staging for this workflow." >&2
  exit 1
fi
if [[ "${LEARNHOUSE_DEVELOPMENT_MODE}" != "false" ]]; then
  echo "LEARNHOUSE_DEVELOPMENT_MODE must be false in staging." >&2
  exit 1
fi
if [[ "${SERVICE_NAME}" == *prod* || "${PROJECT_ID}" == *prod* || "${ARTIFACT_REPOSITORY}" == *prod* ]]; then
  echo "Refusing production-like target: PROJECT_ID=$PROJECT_ID SERVICE_NAME=$SERVICE_NAME ARTIFACT_REPOSITORY=$ARTIFACT_REPOSITORY" >&2
  exit 1
fi

if [[ "${LEARNHOUSE_CONTENT_DELIVERY_TYPE}" == "s3api" && ( -z "${LEARNHOUSE_S3_API_BUCKET_NAME:-}" || -z "${LEARNHOUSE_S3_API_ENDPOINT_URL:-}" ) ]]; then
  echo "S3 API content delivery requires LEARNHOUSE_S3_API_BUCKET_NAME and LEARNHOUSE_S3_API_ENDPOINT_URL." >&2
  exit 1
fi

echo "Staging environment file is structurally valid: $ENV_FILE"
