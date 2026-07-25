#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workflow="$repo_root/.github/workflows/staging-deploy-manual.yml"
raw="$(cat "$workflow")"
deploy="${raw#*  deploy:}"

grep -Fq 'ref: ${{ github.sha }}' <<< "$deploy"
grep -Fq 'name: preserve-control-helpers-and-checkout-approved-sha' <<< "$deploy"
grep -Fq 'git checkout --detach "$FULL_SHA"' <<< "$deploy"
grep -Fq 'source "$CONTROL_HELPERS_DIR/staging-env-file.sh"' <<< "$deploy"
grep -Fq 'validate_bash_env_round_trip "$ENV_FILE" \' <<< "$deploy"
grep -Fq "if: \${{ inputs.mode == 'execute' && needs.plan.outputs.decision == 'GO' }}" <<< "$deploy"

preserve_line="$(grep -n 'name: preserve-control-helpers-and-checkout-approved-sha' "$workflow" | cut -d: -f1)"
auth_line="$(grep -n 'google-github-actions/auth@v2' "$workflow" | cut -d: -f1)"
[[ "$preserve_line" -lt "$auth_line" ]]
grep -Fq 'COMMIT_SHA_INPUT="$FULL_SHA" scripts/validate-staging-deploy-inputs.sh' <<< "$deploy"
if grep -E 'gcloud (run deploy|builds submit|run services update-traffic)' <<< "$raw"; then
  echo 'mutable raw gcloud command found' >&2; exit 1
fi

echo 'staging deploy control contract test passed without authentication or deployment'
