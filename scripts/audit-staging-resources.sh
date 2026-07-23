#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=""
GO_EXIT=0
PENDING_EXIT=10
NOGO_EXIT=20
status="GO"

usage() {
  cat <<'USAGE'
Usage: scripts/audit-staging-resources.sh --env-file PATH

Read-only GCP staging readiness audit. This script only runs describe/list/get-iam-policy
commands and never creates, updates, enables, deploys, migrates, or reads secret values.
Exit codes: 0=GO, 10=PENDÊNCIA EXTERNA, 20=NO-GO, 2=usage/config error.
USAGE
}

while (($#)); do
  case "$1" in
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

record() {
  local item="$1" result="$2" detail="$3"
  printf '%s | %s | %s\n' "$result" "$item" "$detail"
  case "$result" in
    NO-GO) status="NO-GO" ;;
    "PENDÊNCIA EXTERNA") [[ "$status" == "GO" ]] && status="PENDÊNCIA EXTERNA" || true ;;
  esac
  return 0
}

go() { record "$1" "GO" "$2"; }
pending() { record "$1" "PENDÊNCIA EXTERNA" "$2"; }
nogo() { record "$1" "NO-GO" "$2"; }

redact() {
  local value="${1:-}"
  if [[ -z "$value" ]]; then printf '<empty>'; return; fi
  if [[ "$value" == *@* ]]; then
    printf '%s***@%s' "${value:0:2}" "${value##*@}"
  elif ((${#value} <= 8)); then
    printf '<redacted>'
  else
    printf '%s***%s' "${value:0:4}" "${value: -4}"
  fi
}

require_env_name() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then
    go "env:$name" "present ($(redact "${!name}"))"
  else
    nogo "env:$name" "missing required audit input"
  fi
}

run_gcloud() {
  local label="$1" class_on_error="$2"
  shift 2
  local output rc
  set +e
  output="$($@ 2>&1)"
  rc=$?
  set -e
  GCLOUD_OUTPUT="$(printf '%s' "$output" | sed -E 's#(password|token|secret|key)=([^[:space:]]+)#\1=<redacted>#Ig; s#://([^:/@]+):([^@]+)@#://<redacted>:<redacted>@#g')"
  if ((rc == 0)); then
    return 0
  fi
  if [[ "$class_on_error" == "NO-GO" ]]; then
    nogo "$label" "gcloud query failed rc=$rc: ${GCLOUD_OUTPUT:-<no output>}"
  else
    pending "$label" "gcloud query failed rc=$rc: ${GCLOUD_OUTPUT:-<no output>}"
  fi
  return "$rc"
}

contains_line() { awk -v expected="$1" '$0 == expected { found=1 } END { exit found ? 0 : 1 }'; }

[[ -n "$ENV_FILE" ]] || { echo "--env-file is required" >&2; exit 2; }
[[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE" >&2; exit 2; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"
REGION="${GCP_REGION:-${REGION:-}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-${SERVICE_NAME:-}}"
CLOUD_RUN_SERVICE_ACCOUNT="${CLOUD_RUN_SA:-${CLOUD_RUN_SERVICE_ACCOUNT:-}}"
BUCKET="${STAGING_BUCKET:-${GCS_BUCKET:-${LEARNHOUSE_S3_API_BUCKET_NAME:-}}}"
MAX_INSTANCES="${MAX_INSTANCES:-}"
CLOUD_SQL_INSTANCE_NAME="${CLOUD_SQL_INSTANCE##*:}"
RUNTIME_IAM_PRINCIPAL="${RUNTIME_IAM_PRINCIPAL:-serviceAccount:$CLOUD_RUN_SERVICE_ACCOUNT}"

for target in "$PROJECT_ID" "$REGION" "$SERVICE_NAME" "$CLOUD_RUN_SERVICE_ACCOUNT" "$BUCKET" "${STAGING_API_HOST:-}" "${STAGING_API_URL:-}"; do
  if [[ "$target" =~ (^|[-_.:/])prod(uction)?($|[-_.:/])|(^|[-_.:/])main($|[-_.:/]) ]]; then
    nogo "target-safety" "production-like target refused ($(redact "$target")); no gcloud command will be executed"
    printf '\nResultado final: %s\n' "$status"
    exit "$NOGO_EXIT"
  fi
done

for name in PROJECT_ID REGION ARTIFACT_REPOSITORY SERVICE_NAME CLOUD_RUN_SERVICE_ACCOUNT CLOUD_SQL_INSTANCE DB_NAME DB_USER REDIS_INSTANCE VPC_CONNECTOR BUCKET MAX_INSTANCES SECRET_JWT_NAME SECRET_SQL_NAME SECRET_REDIS_NAME; do
  require_env_name "$name"
done

[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] && go "project-shape" "$PROJECT_ID" || nogo "project-shape" "invalid project id"
[[ "$REGION" =~ ^[a-z]+-[a-z]+[0-9]$ ]] && go "region-shape" "$REGION" || nogo "region-shape" "invalid region"
[[ "$MAX_INSTANCES" =~ ^[0-9]+$ && "$MAX_INSTANCES" -le 20 ]] && go "max-instances-config" "MAX_INSTANCES=$MAX_INSTANCES" || nogo "max-instances-config" "must be 0..20"

if ! command -v gcloud >/dev/null 2>&1; then
  pending "gcloud" "CLI not installed in this environment; real GCP audit must be run externally"
  printf '\nResultado final: %s\n' "$status"
  [[ "$status" == "GO" ]] && exit "$GO_EXIT" || [[ "$status" == "PENDÊNCIA EXTERNA" ]] && exit "$PENDING_EXIT" || exit "$NOGO_EXIT"
fi

run_gcloud "authenticated-account" "PENDÊNCIA EXTERNA" gcloud auth list --filter=status:ACTIVE --format='value(account)' || true
active_account="$GCLOUD_OUTPUT"
[[ -n "$active_account" ]] && go "authenticated-account" "$(redact "$active_account")" || pending "authenticated-account" "no active account returned"
run_gcloud "active-project" "PENDÊNCIA EXTERNA" gcloud config get-value project || true
active_project="$GCLOUD_OUTPUT"
[[ "$active_project" == "$PROJECT_ID" ]] && go "active-project" "$PROJECT_ID" || pending "active-project" "active=$(redact "$active_project"), expected=$PROJECT_ID"
run_gcloud "project" "NO-GO" gcloud projects describe "$PROJECT_ID" --format='value(projectId)' || true
project="$GCLOUD_OUTPUT"
[[ "$project" == "$PROJECT_ID" ]] && go "project" "$PROJECT_ID" || nogo "project" "project not found or inaccessible"

run_gcloud "billing" "PENDÊNCIA EXTERNA" gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' || true
billing="$GCLOUD_OUTPUT"
[[ "$billing" == "true" ]] && go "billing" "enabled" || { [[ "$billing" == "false" ]] && nogo "billing" "disabled" || pending "billing" "not confirmed"; }

if run_gcloud "apis" "PENDÊNCIA EXTERNA" gcloud services list --project "$PROJECT_ID" --enabled --format='value(config.name)'; then
  apis="$GCLOUD_OUTPUT"
  if [[ -z "$apis" ]]; then
    nogo "apis" "enabled services query succeeded but returned empty output"
  else
    for api in run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com storage.googleapis.com redis.googleapis.com vpcaccess.googleapis.com; do
      printf '%s\n' "$apis" | contains_line "$api" && go "api:$api" "enabled" || nogo "api:$api" "not listed as enabled"
    done
  fi
else
  pending "apis" "skipped individual API checks because enabled-services query failed"
fi

check_nonempty() {
  local label="$1" required="$2"
  shift 2
  if run_gcloud "$label" "$required" "$@"; then
    if [[ -n "$GCLOUD_OUTPUT" ]]; then
      go "$label" "found $(redact "$GCLOUD_OUTPUT")"
    else
      [[ "$required" == "NO-GO" ]] && nogo "$label" "empty read-only response" || pending "$label" "empty read-only response"
    fi
  fi
}
check_nonempty artifact-registry NO-GO gcloud artifacts repositories describe "$ARTIFACT_REPOSITORY" --project "$PROJECT_ID" --location "$REGION" --format='value(name)'
check_nonempty cloud-run PENDÊNCIA_EXTERNA gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(metadata.name)'
check_nonempty service-account NO-GO gcloud iam service-accounts describe "$CLOUD_RUN_SERVICE_ACCOUNT" --project "$PROJECT_ID" --format='value(email)'
check_nonempty cloud-sql NO-GO gcloud sql instances describe "$CLOUD_SQL_INSTANCE_NAME" --project "$PROJECT_ID" --format='value(name)'
check_nonempty cloud-sql-db NO-GO gcloud sql databases list --instance "$CLOUD_SQL_INSTANCE_NAME" --project "$PROJECT_ID" --filter="name=$DB_NAME" --format='value(name)'
check_nonempty cloud-sql-user NO-GO gcloud sql users list --instance "$CLOUD_SQL_INSTANCE_NAME" --project "$PROJECT_ID" --filter="name=$DB_USER" --format='value(name)'
check_nonempty redis NO-GO gcloud redis instances describe "$REDIS_INSTANCE" --project "$PROJECT_ID" --region "$REGION" --format='value(name)'
check_nonempty vpc-connector NO-GO gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR" --project "$PROJECT_ID" --region "$REGION" --format='value(name)'
check_nonempty bucket NO-GO gcloud storage buckets describe "gs://$BUCKET" --format='value(name)'
check_nonempty regional-quotas PENDÊNCIA_EXTERNA gcloud compute regions describe "$REGION" --project "$PROJECT_ID" --format='value(quotas.metric,quotas.limit,quotas.usage)'

for secret_var in SECRET_JWT_NAME SECRET_SQL_NAME SECRET_REDIS_NAME; do
  secret_name="${!secret_var}"
  if run_gcloud "secret:$secret_var" "NO-GO" gcloud secrets describe "$secret_name" --project "$PROJECT_ID" --format='value(name)'; then
    [[ -n "$GCLOUD_OUTPUT" ]] && go "secret:$secret_var" "exact secret exists by name only ($(redact "$secret_name")); value not accessed" || nogo "secret:$secret_var" "exact secret describe returned empty output"
  fi
done

run_gcloud "iam-policy" "PENDÊNCIA EXTERNA" gcloud projects get-iam-policy "$PROJECT_ID" --format=json || true
iam="$GCLOUD_OUTPUT"
check_iam_binding() {
  local role="$1" principal="$2"
  IAM_JSON="$iam" python3 - "$role" "$principal" <<'PYIAM'
import json, os, sys
role, principal = sys.argv[1], sys.argv[2]
try:
    policy = json.loads(os.environ.get("IAM_JSON", ""))
except Exception:
    sys.exit(2)
for binding in policy.get("bindings", []):
    if binding.get("role") == role and principal in binding.get("members", []):
        sys.exit(0)
sys.exit(1)
PYIAM
}
for role in roles/cloudsql.client roles/secretmanager.secretAccessor roles/storage.objectAdmin; do
  if check_iam_binding "$role" "$RUNTIME_IAM_PRINCIPAL"; then
    go "iam:$role" "role bound to runtime principal $(redact "$RUNTIME_IAM_PRINCIPAL")"
  else
    nogo "iam:$role" "role is not bound to runtime principal $(redact "$RUNTIME_IAM_PRINCIPAL")"
  fi
done

run_gcloud "cloud-run-max-instances" "PENDÊNCIA EXTERNA" gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(spec.template.metadata.annotations.autoscaling.knative.dev/maxScale)' || true
run_max="$GCLOUD_OUTPUT"
[[ -z "$run_max" ]] && pending "cloud-run-max-instances" "service absent or annotation not returned" || { [[ "$run_max" =~ ^[0-9]+$ && "$run_max" -le 20 ]] && go "cloud-run-max-instances" "maxScale=$run_max" || nogo "cloud-run-max-instances" "maxScale=$run_max exceeds staging guardrail"; }

printf '\nResultado final: %s\n' "$status"
[[ "$status" == "GO" ]] && exit "$GO_EXIT" || [[ "$status" == "PENDÊNCIA EXTERNA" ]] && exit "$PENDING_EXIT" || exit "$NOGO_EXIT"
