#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.staging"
SIMULATED="false"

usage() {
  cat <<'USAGE'
Usage: scripts/preflight-staging.sh --env-file .env.staging [--simulated]

Validation-only staging preflight. It never creates resources, never deploys,
never enables APIs, never changes the active gcloud project, and never prints secrets.
Exit semantics: GO exits 0; PENDÊNCIA EXTERNA exits 10; NO-GO exits 20; invalid arguments exit 2.
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

if ! command -v grep >/dev/null 2>&1; then
  fail "required tool missing: grep"
elif [[ -f "$ENV_FILE" ]] && grep -Enq '(<[A-Z0-9_:-]+>|REPLACE_WITH_|CHANGE_ME|TODO_SECRET|YOUR_)' "$ENV_FILE"; then
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

for bin in bash curl docker git; do
  if command -v "$bin" >/dev/null 2>&1; then ok "tool present: $bin"; elif [[ "$SIMULATED" == "true" ]]; then warn "tool missing in simulated CI: $bin"; else fail "required tool missing: $bin"; fi
done
if command -v gcloud >/dev/null 2>&1; then
  ok "tool present: gcloud"
elif [[ "$SIMULATED" == "true" ]]; then
  warn "tool missing in simulated CI: gcloud"
else
  fail "required tool missing: gcloud"
fi

capture_gcloud() {
  local __var="$1"
  shift
  local output
  local rc
  output="$($@ 2>/tmp/preflight-gcloud-error)" || rc=$?
  rc="${rc:-0}"
  printf -v "$__var" '%s' "$output"
  return "$rc"
}

validate_gcloud_readonly() {
  local active_account=""
  if ! capture_gcloud active_account gcloud auth list --filter=status:ACTIVE --format='value(account)'; then
    warn "gcloud authentication cannot be queried; run gcloud auth login outside this script"
    return 0
  fi
  if [[ -z "$active_account" ]]; then
    warn "gcloud has no active account; authentication is required before deploy day"
    return 0
  fi
  ok "gcloud has an active account"

  local billing_enabled=""
  if ! capture_gcloud billing_enabled gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)'; then
    warn "billing cannot be queried for project $PROJECT_ID"
  elif [[ "$billing_enabled" == "true" ]]; then
    ok "billing is enabled for the staging project"
  elif [[ "$billing_enabled" == "false" ]]; then
    fail "billing is disabled for the staging project"
  else
    fail "billing query returned an empty or unexpected value"
  fi

  local enabled_apis=""
  if ! capture_gcloud enabled_apis gcloud services list --project "$PROJECT_ID" --enabled --format='value(config.name)'; then
    warn "enabled API list cannot be queried for project $PROJECT_ID"
  elif [[ -z "$enabled_apis" ]]; then
    fail "enabled API list query returned empty output"
  else
    local api
    local required_apis=(run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com storage.googleapis.com)
    [[ -n "${REDIS_INSTANCE:-}" ]] && required_apis+=(redis.googleapis.com)
    [[ -n "${VPC_CONNECTOR:-}" ]] && required_apis+=(vpcaccess.googleapis.com)
    for api in "${required_apis[@]}"; do
      if printf '%s\n' "$enabled_apis" | awk -v expected="$api" '$0 == expected { found=1 } END { exit found ? 0 : 1 }'; then
        ok "API enabled: $api"
      else
        fail "required API is not enabled or was not returned by gcloud: $api"
      fi
    done
  fi

  if gcloud artifacts repositories describe "${ARTIFACT_REPOSITORY:-}" --project "$PROJECT_ID" --location "$REGION" --format='value(name)' >/tmp/preflight-artifact 2>/tmp/preflight-gcloud-error && [[ -s /tmp/preflight-artifact ]]; then
    ok "Artifact Registry exists"
  else
    warn "Artifact Registry absent, empty, or not queryable"
  fi
  if gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(metadata.name)' >/tmp/preflight-run 2>/tmp/preflight-gcloud-error && [[ -s /tmp/preflight-run ]]; then
    ok "Cloud Run service exists"
  else
    warn "Cloud Run service absent before first deploy or not queryable"
  fi
  if gcloud sql instances describe "${CLOUD_SQL_INSTANCE##*:}" --project "$PROJECT_ID" --format='value(name)' >/tmp/preflight-sql 2>/tmp/preflight-gcloud-error && [[ -s /tmp/preflight-sql ]]; then
    ok "Cloud SQL instance exists"
  else
    warn "Cloud SQL instance absent, empty, or not queryable"
  fi
  if gcloud storage buckets describe "gs://$BUCKET" --format='value(name)' >/tmp/preflight-bucket 2>/tmp/preflight-gcloud-error && [[ -s /tmp/preflight-bucket ]]; then
    ok "staging bucket exists"
  else
    warn "staging bucket absent, empty, or not queryable"
  fi
}

if [[ "$SIMULATED" == "true" ]]; then
  warn "simulated mode: skipped real gcloud authentication, billing, API and resource queries"
else
  validate_gcloud_readonly
fi

printf '\nResultado final: %s\n' "$status"
case "$status" in
  GO) exit 0 ;;
  "PENDÊNCIA EXTERNA") exit 10 ;;
  *) exit 20 ;;
esac
