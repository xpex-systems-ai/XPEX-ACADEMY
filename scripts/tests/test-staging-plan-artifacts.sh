#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
env_file="$tmp/invalid.env"
artifacts="$tmp/staging-plan"
mkdir -p "$artifacts"
printf 'BROKEN=(\n' > "$env_file"
printf 'plan_config_sha256=test-only\n' > "$artifacts/config-fingerprint.txt"

set +e
"$repo_root/scripts/render-first-staging-deploy-plan.sh" --env-file "$env_file" > "$artifacts/plan.md" 2>&1
renderer_rc=$?
"$repo_root/scripts/audit-staging-resources.sh" --env-file "$env_file" > "$artifacts/audit.md" 2>&1
audit_rc=$?
"$repo_root/scripts/preflight-staging.sh" --env-file "$env_file" > "$artifacts/preflight.md" 2>&1
preflight_rc=$?
"$repo_root/scripts/classify-staging-plan.sh" "$renderer_rc" "$audit_rc" "$preflight_rc" > "$tmp/decision" 2>&1
final_rc=$?
set -e

[[ "$final_rc" -eq 20 ]]
grep -Fq 'NO-GO' "$tmp/decision"
for report in plan.md audit.md preflight.md config-fingerprint.txt; do
  [[ -s "$artifacts/$report" ]]
done

echo 'NO-GO artifact preservation test passed'
