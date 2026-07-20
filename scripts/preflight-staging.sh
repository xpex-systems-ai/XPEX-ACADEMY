#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.staging"
SIMULATED="false"

usage() {
  cat <<'USAGE'
Usage: scripts/preflight-staging.sh --env-file .env.staging [--simulated]

Validation-only staging preflight. It never creates resources, never deploys,
never enables APIs, never changes the active gcloud project, and never prints secrets.
USAGE
}

while (($#)); do
  case "$1" in
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    --simulated) SIMULATED="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

status="GO"
warn() { printf 'PENDÊNCIA EXTERNA: %s\n' "$*"; [[ "$status" == "GO" ]] && status="PENDÊNCIA EXTERNA"; return 0; }
fail() { printf 'NO-GO: %s\n' "$*"; status="NO-GO"; return 0; }
ok() { printf 'OK: %s\n' "$*"; }
mask() { printf '<redacted:%s>' "$1"; }

[[ -n "$ENV_FILE" ]] || { echo "--env-file requires a path" >&2; exit 2; }
[[ -f "$ENV_FILE" ]] && ok "env file exists: $ENV_FILE" || fail "missing env file: $ENV_FILE"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
    fail "$ENV_FILE is tracked by Git; local staging env files must never be committed"
  else
    ok "$ENV_FILE is not tracked by Git"
  fi
  if [[ "$(basename "$ENV_FILE")" == ".env.staging" ]]; then
    git check-ignore -q "$ENV_FILE" && ok "$ENV_FILE is ignored by Git" || fail "$ENV_FILE is not protected by .gitignore"
  fi
fi

if [[ -f "$ENV_FILE" ]] && rg -n '(<[A-Z0-9_:-]+>|REPLACE_WITH_|CHANGE_ME|TODO_SECRET|YOUR_)' "$ENV_FILE" >/dev/null; then
  fail "env file still contains unsubstituted placeholders"
else
  ok "no generic placeholders detected in env file"
fi

set -a
# shellcheck disable=SC1090
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"
set +a

PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"
REGION="${GCP_REGION:-${REGION:-}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-${SERVICE_NAME:-}}"
CLOUD_RUN_SERVICE_ACCOUNT="${CLOUD_RUN_SA:-${CLOUD_RUN_SERVICE_ACCOUNT:-}}"
BUCKET="${STAGING_BUCKET:-${GCS_BUCKET:-${LEARNHOUSE_S3_API_BUCKET_NAME:-}}}"
MAX_INSTANCES="${MAX_INSTANCES:-5}"
IMAGE_TAG="${IMAGE_TAG:-staging-dry-run}"

required=(PROJECT_ID REGION ARTIFACT_REPOSITORY SERVICE_NAME IMAGE_NAME CLOUD_RUN_SERVICE_ACCOUNT CLOUD_SQL_INSTANCE DB_NAME DB_USER REDIS_INSTANCE VPC_CONNECTOR BUCKET STAGING_API_HOST STAGING_API_URL STAGING_FRONTEND_ORIGIN IMAGE_TAG MAX_INSTANCES LEARNHOUSE_ENV LEARNHOUSE_SQL_CONNECTION_STRING LEARNHOUSE_REDIS_CONNECTION_STRING LEARNHOUSE_CONTENT_DELIVERY_TYPE)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] && ok "required variable present: $name=$(mask "$name")" || fail "missing required variable: $name"
done

if [[ "${LEARNHOUSE_ENV:-}" != "staging" ]]; then fail "LEARNHOUSE_ENV must be staging"; fi
if [[ "$PROJECT_ID $SERVICE_NAME ${ARTIFACT_REPOSITORY:-} ${BUCKET:-} ${STAGING_API_HOST:-} ${STAGING_API_URL:-} ${STAGING_FRONTEND_ORIGIN:-}" =~ (prod|production|main) ]]; then
  fail "target metadata contains production-like token"
else
  ok "target metadata does not contain production-like tokens"
fi
[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] && ok "project id shape is valid" || fail "invalid GCP project id shape"
[[ "$REGION" =~ ^[a-z]+-[a-z]+[0-9]$ ]] && ok "region shape is valid" || fail "invalid GCP region shape"
[[ "$SERVICE_NAME" =~ ^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$ ]] && ok "Cloud Run service name shape is valid" || fail "invalid Cloud Run service name shape"
[[ "$BUCKET" =~ ^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$ ]] && ok "bucket name shape is valid" || fail "invalid bucket name shape"
[[ "$MAX_INSTANCES" =~ ^[0-9]+$ && "$MAX_INSTANCES" -ge 0 && "$MAX_INSTANCES" -le 20 ]] && ok "MAX_INSTANCES is bounded for staging" || fail "MAX_INSTANCES must be an integer from 0 to 20"

for bin in bash curl docker git gcloud; do
  if command -v "$bin" >/dev/null 2>&1; then ok "tool present: $bin"; else [[ "$SIMULATED" == "true" ]] && warn "tool missing in simulated CI: $bin" || fail "required tool missing: $bin"; fi
done

if [[ "$SIMULATED" == "true" ]]; then
  warn "simulated mode: skipped real gcloud authentication, billing, API and resource queries"
else
  gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1 >/tmp/preflight-gcloud-account 2>/dev/null || fail "cannot query gcloud authentication"
  [[ -s /tmp/preflight-gcloud-account ]] && ok "gcloud has an active account" || fail "gcloud has no active account"
  gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' >/dev/null 2>&1 && ok "billing can be queried" || warn "billing cannot be queried or project is not accessible"
  for api in run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com vpcaccess.googleapis.com redis.googleapis.com storage.googleapis.com; do
    gcloud services list --project "$PROJECT_ID" --enabled --filter="config.name:$api" --format='value(config.name)' >/dev/null 2>&1 && ok "API query allowed: $api" || warn "API query not allowed: $api"
  done
  gcloud artifacts repositories describe "${ARTIFACT_REPOSITORY:-}" --project "$PROJECT_ID" --location "$REGION" >/dev/null 2>&1 && ok "Artifact Registry exists" || warn "Artifact Registry absent or not queryable"
  gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" >/dev/null 2>&1 && ok "Cloud Run service exists" || warn "Cloud Run service absent before first deploy"
  gcloud sql instances describe "${CLOUD_SQL_INSTANCE##*:}" --project "$PROJECT_ID" >/dev/null 2>&1 && ok "Cloud SQL instance exists" || warn "Cloud SQL instance absent or not queryable"
  gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1 && ok "staging bucket exists" || warn "staging bucket absent or not queryable"
fi

printf '\nResultado final: %s\n' "$status"
[[ "$status" != "NO-GO" ]]
