#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=""
GO_EXIT=0
PENDING_EXIT=10
NOGO_EXIT=20
status="GO"
MUTABLE_PREFIX="⚠️ COMANDO MUTÁVEL — EXECUÇÃO HUMANA APÓS APROVAÇÃO"

usage() {
  cat <<'USAGE'
Usage: scripts/render-first-staging-deploy-plan.sh --env-file PATH

Read-only renderer for the first real staging deploy plan. It validates local/GCP
readiness through read-only audit and preflight scripts, refuses production-like
targets, masks sensitive data, and prints mutable commands only as human-approved
proposals. It never creates resources, changes IAM, enables APIs, writes secrets,
submits builds, deploys, changes traffic, rolls back, or runs migrations.
Exit codes: 0=plano pronto, 10=pendência externa, 20=NO-GO, 2=usage/config error.
USAGE
}

while (($#)); do
  case "$1" in
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

mark_pending() { [[ "$status" == "GO" ]] && status="PENDÊNCIA EXTERNA" || true; printf 'PENDÊNCIA EXTERNA: %s\n' "$*"; }
mark_nogo() { status="NO-GO"; printf 'NO-GO: %s\n' "$*"; }
ok() { printf 'OK: %s\n' "$*"; }

redact_text() {
  sed -E \
    -e 's#(postgres(ql)?(\+asyncpg)?://)[^[:space:]@]+@#\1<redacted>@#gI' \
    -e 's#(redis://)[^[:space:]@]*@?#\1<redacted>@#gI' \
    -e 's#(SECRET|TOKEN|PASSWORD|JWT|KEY|CONNECTION_STRING)=([^[:space:]]+)#\1=<redacted>#gI' \
    -e 's#(--set-secrets[= ][^[:space:]]+)#--set-secrets=<redacted-secret-bindings>#gI'
}

quote() { printf '%q' "$1"; }
propose() { printf '%s\n  %s\n' "$MUTABLE_PREFIX" "$*" | redact_text; }
readonly_cmd() { printf 'READ-ONLY: %s\n' "$*" | redact_text; }

[[ -n "$ENV_FILE" ]] || { echo "--env-file is required" >&2; exit 2; }
[[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE" >&2; exit 2; }

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git ls-files --error-unmatch "$ENV_FILE" >/dev/null 2>&1; then
    mark_nogo "$ENV_FILE is tracked by Git"
  else
    ok "$ENV_FILE is not tracked by Git"
  fi
fi

if grep -Enq '(<[A-Z0-9_:-]+>|REPLACE_WITH_|CHANGE_ME|TODO_SECRET|YOUR_)' "$ENV_FILE"; then
  mark_nogo "env file contains placeholders"
else
  ok "no placeholders detected"
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"
REGION="${GCP_REGION:-${REGION:-}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-${SERVICE_NAME:-}}"
CLOUD_RUN_SERVICE_ACCOUNT="${CLOUD_RUN_SA:-${CLOUD_RUN_SERVICE_ACCOUNT:-}}"
BUCKET="${STAGING_BUCKET:-${GCS_BUCKET:-${LEARNHOUSE_S3_API_BUCKET_NAME:-}}}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || printf staging)}"
MAX_INSTANCES="${MAX_INSTANCES:-}"
PREVIOUS_REVISION="${PREVIOUS_REVISION:-}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPOSITORY:-}/${IMAGE_NAME:-}:${IMAGE_TAG}"

for target in "$PROJECT_ID" "$REGION" "$SERVICE_NAME" "${ARTIFACT_REPOSITORY:-}" "$BUCKET" "${STAGING_API_HOST:-}" "${STAGING_API_URL:-}" "${STAGING_FRONTEND_ORIGIN:-}" "${GITHUB_BASE_REF:-}" "${BRANCH_NAME:-}"; do
  if [[ "$target" =~ (^|[-_.:/])prod(uction)?($|[-_.:/])|(^|[-_.:/])main($|[-_.:/]) ]]; then
    mark_nogo "production-like target refused: ${target:0:4}***"
  fi
done

required=(PROJECT_ID REGION ARTIFACT_REPOSITORY SERVICE_NAME IMAGE_NAME CLOUD_RUN_SERVICE_ACCOUNT CLOUD_SQL_INSTANCE DB_NAME DB_USER REDIS_INSTANCE VPC_CONNECTOR BUCKET MAX_INSTANCES SECRET_JWT_NAME SECRET_SQL_NAME SECRET_REDIS_NAME STAGING_API_URL STAGING_FRONTEND_ORIGIN)
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] && ok "required variable present: $name" || mark_nogo "missing required variable: $name"
done
[[ "$MAX_INSTANCES" =~ ^[0-9]+$ && "$MAX_INSTANCES" -ge 0 && "$MAX_INSTANCES" -le 20 ]] && ok "MAX_INSTANCES within staging guardrail" || mark_nogo "MAX_INSTANCES must be 0..20"
[[ -n "$PREVIOUS_REVISION" ]] && ok "previous revision captured" || mark_pending "PREVIOUS_REVISION absent; first deploy may continue only with rollback note approved"

if [[ "$status" == "NO-GO" ]]; then
  printf '\nResultado final: %s\n' "$status"
  exit "$NOGO_EXIT"
fi

run_check() {
  local label="$1"; shift
  local output rc
  set +e
  output="$($@ 2>&1)"
  rc=$?
  set -e
  printf '\n## %s\n' "$label"
  printf '%s\n' "$output" | redact_text
  case "$rc" in
    0) ok "$label returned GO" ;;
    10) mark_pending "$label returned PENDÊNCIA EXTERNA" ;;
    20) mark_nogo "$label returned NO-GO" ;;
    *) mark_nogo "$label failed with rc=$rc" ;;
  esac
  CHECK_RC="$rc"
  return 0
}

# Official wrapper sequence: audit -> preflight -> build -> deploy -> verify -> rollback.
# The first two wrappers are read-only checks executed by this renderer. Build, deploy,
# verify and rollback are rendered only as concrete human-run wrapper commands.
run_check "audit" scripts/audit-staging-resources.sh --env-file "$ENV_FILE"
audit_rc="$CHECK_RC"
if [[ "$audit_rc" -eq 20 || "$status" == "NO-GO" ]]; then
  printf '\nResultado final: %s\n' "NO-GO"
  exit "$NOGO_EXIT"
fi

if command -v gcloud >/dev/null 2>&1; then
  run_check "preflight" scripts/preflight-staging.sh --env-file "$ENV_FILE"
else
  mark_pending "gcloud CLI absent; preflight executed in simulated mode"
  run_check "preflight" scripts/preflight-staging.sh --env-file "$ENV_FILE" --simulated
fi
preflight_rc="$CHECK_RC"
if [[ "$preflight_rc" -eq 20 || "$status" == "NO-GO" ]]; then
  printf '\nResultado final: %s\n' "NO-GO"
  exit "$NOGO_EXIT"
fi
if [[ "$status" == "PENDÊNCIA EXTERNA" ]]; then
  printf '\nPlano não aprovado: resolva as pendências externas antes de renderizar comandos de execução.\n'
  printf '\nResultado final: %s\n' "$status"
  exit "$PENDING_EXIT"
fi

printf '\n# Plano concreto para execução humana aprovada\n'
propose "scripts/build-staging.sh --env-file $(quote "$ENV_FILE")"
propose "scripts/deploy-staging.sh --env-file $(quote "$ENV_FILE")"
propose "scripts/verify-staging-deployment.sh $(quote "${STAGING_API_URL:-}") $(quote "${STAGING_FRONTEND_ORIGIN:-}")"
propose "scripts/prepare-staging-rollback.sh --env-file $(quote "$ENV_FILE") --previous-revision $(quote "${PREVIOUS_REVISION:-<capture-before-deploy>}")"

printf '\nResultado final: %s\n' "$status"
[[ "$status" == "GO" ]] && exit "$GO_EXIT" || [[ "$status" == "PENDÊNCIA EXTERNA" ]] && exit "$PENDING_EXIT" || exit "$NOGO_EXIT"
