#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.staging}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.staging.example and fill non-secret metadata." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(PROJECT_ID REGION ARTIFACT_REPOSITORY SERVICE_NAME IMAGE_NAME CLOUD_RUN_SERVICE_ACCOUNT CLOUD_SQL_INSTANCE VPC_CONNECTOR GCS_BUCKET LEARNHOUSE_AUTH_JWT_SECRET_KEY LEARNHOUSE_SQL_CONNECTION_STRING LEARNHOUSE_REDIS_CONNECTION_STRING LEARNHOUSE_DOMAIN LEARNHOUSE_FRONTEND_DOMAIN LEARNHOUSE_ALLOWED_REGEXP)
missing=()
placeholder=()
for name in "${required[@]}"; do
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

echo "Staging environment file is structurally valid: $ENV_FILE"
