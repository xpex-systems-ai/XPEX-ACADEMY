#!/usr/bin/env bash
set -euo pipefail

REQUIRE_DEV_ANCESTRY=false
while (($#)); do
  case "$1" in
    --require-dev-ancestry) REQUIRE_DEV_ANCESTRY=true; shift ;;
    -h|--help)
      cat <<'USAGE'
Usage: COMMIT_SHA_INPUT=... MODE_INPUT=plan|execute [CONFIRMATION_INPUT=...] [PREVIOUS_REVISION_INPUT=...] [CHANGE_TICKET_INPUT=...] scripts/validate-staging-deploy-inputs.sh [--require-dev-ancestry]

Read-only validation for the manual staging deploy workflow. It never calls gcloud,
never reads secrets, and never mutates local or remote resources. Exit codes:
0=valid, 20=NO-GO input/ancestry validation failure, 2=usage error.
USAGE
      exit 0 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

EXPECTED_CONFIRMATION="${EXPECTED_CONFIRMATION:-DEPLOY_XPEX_STAGING}"
COMMIT_SHA_INPUT="${COMMIT_SHA_INPUT:-}"
MODE_INPUT="${MODE_INPUT:-plan}"
CONFIRMATION_INPUT="${CONFIRMATION_INPUT:-}"
PREVIOUS_REVISION_INPUT="${PREVIOUS_REVISION_INPUT:-}"
CHANGE_TICKET_INPUT="${CHANGE_TICKET_INPUT:-}"

nogo() { echo "NO-GO: $*" >&2; exit 20; }

reject_unsafe_value() {
  local label="$1" value="$2"
  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    nogo "$label contains CR/LF"
  fi
  if printf '%s' "$value" | LC_ALL=C grep -q '[[:cntrl:]]'; then
    nogo "$label contains unsupported control characters"
  fi
}

for pair in \
  "commit_sha:$COMMIT_SHA_INPUT" \
  "mode:$MODE_INPUT" \
  "confirmation:$CONFIRMATION_INPUT" \
  "previous_revision:$PREVIOUS_REVISION_INPUT" \
  "change_ticket:$CHANGE_TICKET_INPUT"; do
  reject_unsafe_value "${pair%%:*}" "${pair#*:}"
done

[[ "$COMMIT_SHA_INPUT" =~ ^[0-9a-fA-F]{40}$ ]] || nogo "commit_sha must be a full 40-character SHA"
[[ "$MODE_INPUT" == "plan" || "$MODE_INPUT" == "execute" ]] || nogo "mode must be plan or execute"

if [[ "$MODE_INPUT" == "execute" ]]; then
  [[ "$CONFIRMATION_INPUT" == "$EXPECTED_CONFIRMATION" ]] || nogo "execute requires exact confirmation"
  [[ "$PREVIOUS_REVISION_INPUT" =~ ^[a-z0-9]([-a-z0-9]*[a-z0-9])-[0-9]{5}-[a-z0-9]+$ ]] || nogo "execute requires a concrete previous_revision"
  [[ -n "$CHANGE_TICKET_INPUT" ]] || nogo "execute requires change_ticket"
fi

if [[ "$REQUIRE_DEV_ANCESTRY" == true ]]; then
  git cat-file -e "$COMMIT_SHA_INPUT^{commit}" || nogo "commit_sha object does not exist"
  full_sha="$(git rev-parse "$COMMIT_SHA_INPUT^{commit}")"
  [[ "$full_sha" == "$COMMIT_SHA_INPUT" ]] || nogo "resolved SHA mismatch"
  git merge-base --is-ancestor "$full_sha" refs/remotes/origin/dev || nogo "commit_sha is not in origin/dev history"
  printf 'FULL_SHA=%s\n' "$full_sha"
  printf 'IMAGE_TAG=stg-%s\n' "${full_sha:0:12}"
fi
