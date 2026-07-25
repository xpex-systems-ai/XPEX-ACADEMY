#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
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
[[ -n "$historical_sha" ]]
git cat-file -e "$historical_sha:scripts/render-first-staging-deploy-plan.sh"
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

echo 'historical SHA control-helper preservation test passed'
