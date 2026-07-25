#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
classifier="$repo_root/scripts/classify-staging-plan.sh"

expect() {
  local expected_rc="$1" expected_text="$2"
  shift 2
  local output rc
  set +e
  output="$($classifier "$@" 2>&1)"
  rc=$?
  set -e
  [[ "$rc" -eq "$expected_rc" ]]
  grep -Fq "$expected_text" <<< "$output"
}

expect 0 GO 0 0 0
expect 10 'PENDÊNCIA EXTERNA' 0 10 0
expect 20 NO-GO 0 20 10
expect 20 'unexpected check exit code: 1' 0 1 0
expect 20 'unexpected check exit code: 127' 127 0 0

echo 'staging plan classification tests passed'
