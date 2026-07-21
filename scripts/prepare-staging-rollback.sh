#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.staging}"
DRY_RUN="${DRY_RUN:-true}"
PREVIOUS_REVISION="${PREVIOUS_REVISION:-}"
NEW_REVISION="${NEW_REVISION:-}"
PREVIOUS_REVISION_EXPLICIT="false"

usage() {
  cat <<'USAGE'
Usage: scripts/prepare-staging-rollback.sh [--env-file .env.staging] [--previous-revision REV] [--new-revision REV] [--execute]

Inspects Cloud Run revisions and prints a concrete rollback command. Defaults to
inspection/dry-run and never changes traffic unless --execute is provided with a
concrete previous revision. PREVIOUS_REVISION placeholders are rejected.
USAGE
}

while (($#)); do
  case "$1" in
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    --previous-revision) PREVIOUS_REVISION="${2:-}"; PREVIOUS_REVISION_EXPLICIT="true"; shift 2 ;;
    --new-revision) NEW_REVISION="${2:-}"; shift 2 ;;
    --execute) DRY_RUN="false"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n "$ENV_FILE" ]] || { echo "--env-file requires a path" >&2; exit 2; }
"$(dirname "$0")/check-env.sh" "$ENV_FILE" >/dev/null
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-}}"
REGION="${GCP_REGION:-${REGION:-}}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-${SERVICE_NAME:-}}"

if [[ "${LEARNHOUSE_ENV:-}" != "staging" || "$PROJECT_ID $SERVICE_NAME" =~ (prod|production|main) ]]; then
  echo "NO-GO: Refusing rollback preparation for non-staging target." >&2
  exit 1
fi

reject_placeholder() {
  local value="$1"
  [[ -z "$value" ]] && return 0
  if [[ "$value" == "PREVIOUS_REVISION" || "$value" == *PLACEHOLDER* || "$value" == *REPLACE_WITH* ]]; then
    echo "NO-GO: Refusing placeholder revision: $value" >&2
    exit 1
  fi
}
reject_placeholder "$PREVIOUS_REVISION"
reject_placeholder "$NEW_REVISION"

if [[ "$DRY_RUN" != "true" && "$PREVIOUS_REVISION_EXPLICIT" != "true" ]]; then
  echo "NO-GO: --execute requires an explicit --previous-revision REV captured before deploy." >&2
  exit 1
fi

if [[ -z "$PREVIOUS_REVISION" ]]; then
  if ! command -v gcloud >/dev/null 2>&1; then
    echo "NO-GO: Cannot determine previous revision: gcloud is unavailable. Pass --previous-revision with a concrete revision after human inspection." >&2
    exit 1
  fi
  PREVIOUS_REVISION="$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.traffic[0].revisionName)' 2>/dev/null || true)"
fi

if [[ -z "$PREVIOUS_REVISION" ]]; then
  echo "NO-GO: Cannot prepare rollback: no current traffic revision could be determined." >&2
  exit 1
fi

if [[ -z "$NEW_REVISION" ]] && command -v gcloud >/dev/null 2>&1; then
  NEW_REVISION="$(gcloud run revisions list --service "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --sort-by='~metadata.creationTimestamp' --limit=1 --format='value(metadata.name)' 2>/dev/null || true)"
fi

rollback_cmd=(gcloud run services update-traffic "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --to-revisions "$PREVIOUS_REVISION=100")

cat <<PLAN
Staging rollback inspection (secrets redacted):
- Project: $PROJECT_ID
- Region: $REGION
- Service: $SERVICE_NAME
- Revision currently/previously receiving traffic: $PREVIOUS_REVISION
- Newest revision observed: ${NEW_REVISION:-A CONFIRMAR NO GCP}
- Rollback command: ${rollback_cmd[*]}
PLAN

if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY_RUN=true: no traffic was changed."
else
  "${rollback_cmd[@]}"
fi
