#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_head="$(git -C "$repo_root" rev-parse HEAD)"
source_status="$(git -C "$repo_root" status --porcelain=v1)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet --no-hardlinks "$repo_root" "$tmp/repo"
cd "$tmp/repo"

historical_sha=""
while read -r candidate; do
  if ! git cat-file -e "$candidate:scripts/staging-env-file.sh" 2>/dev/null && \
     ! git cat-file -e "$candidate:scripts/classify-staging-plan.sh" 2>/dev/null; then
    historical_sha="$candidate"
    break
  fi
done < <(git rev-list --first-parent HEAD)
if [[ -z "$historical_sha" ]]; then
  echo 'NO-GO: repository history is insufficient to find a commit predating control helpers; checkout with fetch-depth: 0' >&2
  exit 20
fi
git merge-base --is-ancestor "$historical_sha" HEAD || { echo 'NO-GO: selected historical SHA is not an ancestor' >&2; exit 20; }
for path in scripts/render-first-staging-deploy-plan.sh scripts/audit-staging-resources.sh scripts/preflight-staging.sh scripts/validate-staging-deploy-inputs.sh; do
  git cat-file -e "$historical_sha:$path" || { printf 'NO-GO: historical SHA lacks plan operational script: %s\n' "$path" >&2; exit 20; }
done
! git cat-file -e "$historical_sha:scripts/staging-env-file.sh" 2>/dev/null
! git cat-file -e "$historical_sha:scripts/classify-staging-plan.sh" 2>/dev/null

helpers="$tmp/control-helpers"
install -d -m 700 "$helpers"
install -m 700 scripts/staging-env-file.sh "$helpers/staging-env-file.sh"
install -m 700 scripts/classify-staging-plan.sh "$helpers/classify-staging-plan.sh"
before="$(sha256sum "$helpers"/*.sh)"
git checkout --quiet --detach "$historical_sha"
after="$(sha256sum "$helpers"/*.sh)"
[[ "$before" == "$after" ]]
[[ -x "$helpers/staging-env-file.sh" && -x "$helpers/classify-staging-plan.sh" ]]
[[ "$(git rev-parse HEAD)" == "$historical_sha" ]]
[[ -f scripts/render-first-staging-deploy-plan.sh ]]

set +e
output="$("$helpers/classify-staging-plan.sh" 0 10 0 2>&1)"
rc=$?
set -e
[[ "$rc" -eq 10 && "$output" == 'PENDÊNCIA EXTERNA' ]]
[[ "$output" != *'command not found'* && "$output" != *'No such file or directory'* ]]
[[ "$(git -C "$repo_root" rev-parse HEAD)" == "$source_head" ]]
[[ "$(git -C "$repo_root" status --porcelain=v1)" == "$source_status" ]]

echo 'historical SHA control-helper preservation test passed'
