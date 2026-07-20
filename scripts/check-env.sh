#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.staging.example}"
required=(GCP_PROJECT_ID GCP_REGION ARTIFACT_REPOSITORY CLOUD_RUN_SERVICE CLOUD_RUN_SERVICE_ACCOUNT LEARNHOUSE_ENV LEARNHOUSE_DOMAIN LEARNHOUSE_FRONTEND_DOMAIN LEARNHOUSE_AUTH_JWT_SECRET_KEY_SECRET LEARNHOUSE_SQL_CONNECTION_STRING_SECRET)
if [[ ! -f "$ENV_FILE" ]]; then echo "Missing env file: $ENV_FILE" >&2; exit 1; fi
missing=0
for key in "${required[@]}"; do
  if ! grep -Eq "^${key}=" "$ENV_FILE"; then echo "Missing required key: $key" >&2; missing=1; fi
done
if grep -Eq '(AKIA[0-9A-Z]{16}|-----BEGIN .*PRIVATE KEY-----|sk_live_|AIza[0-9A-Za-z_-]{35})' "$ENV_FILE"; then
  echo "Potential real secret found in $ENV_FILE" >&2; exit 1
fi
if [[ "$missing" -ne 0 ]]; then exit 1; fi
echo "Environment template looks valid: $ENV_FILE"
