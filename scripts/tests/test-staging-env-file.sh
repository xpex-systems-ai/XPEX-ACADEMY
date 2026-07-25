#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/staging-env-file.sh
source "$repo_root/scripts/staging-env-file.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
env_file="$tmp/staging.env"
: > "$env_file"
chmod 600 "$env_file"

values=(
  'XpeX Academy Staging'
  'XpeX Academy staging API'
  'valor com "aspas duplas"'
  "valor com 'aspas simples'"
  'valor-com-$-cifrao'
  'valor#com#cerquilha'
  'barra\invertida'
  'https://api-staging.xpex-academy.invalid/path?a=1&b=2'
  'texto com espaços no meio'
  ' texto com espaço inicial e final '
  ''
  'true'
  '42'
)

expected_pairs=()
for i in "${!values[@]}"; do
  name="ROUND_TRIP_$i"
  unset "$name" || true
  expected_pairs+=("$name" "${values[$i]}")
  append_bash_env "$env_file" "$name" "${values[$i]}"
done

validate_bash_env_round_trip "$env_file" "${expected_pairs[@]}" >/dev/null
[[ "$(stat -c '%a' "$env_file")" == 600 ]]

marker="$tmp/executed"
COMMAND_GUARD="safe value; touch $marker"
append_bash_env "$env_file" COMMAND_GUARD "$COMMAND_GUARD"
validate_bash_env_round_trip "$env_file" COMMAND_GUARD "$COMMAND_GUARD" >/dev/null
[[ ! -e "$marker" ]]

if validate_bash_env_round_trip "$env_file" COMMAND_GUARD 2>/dev/null; then
  echo 'legacy names-only round-trip API was accepted' >&2; exit 1
fi
if validate_bash_env_round_trip "$env_file" 2>/dev/null; then
  echo 'round-trip API accepted no explicit pairs' >&2; exit 1
fi
mismatch_secret='must-not-appear-in-output'
set +e
mismatch_output="$(validate_bash_env_round_trip "$env_file" COMMAND_GUARD "$mismatch_secret" 2>&1)"
mismatch_rc=$?
set -e
if [[ "$mismatch_rc" -ne 20 ]]; then
  echo 'round-trip mismatch was accepted' >&2; exit 1
fi
[[ "$mismatch_output" != *"$mismatch_secret"* && "$mismatch_output" != *"$COMMAND_GUARD"* ]]

if append_bash_env "$env_file" BAD_NEWLINE $'line one\nline two' 2>/dev/null; then
  echo 'newline was accepted' >&2; exit 1
fi
if append_bash_env "$env_file" BAD_CR $'line one\rline two' 2>/dev/null; then
  echo 'carriage return was accepted' >&2; exit 1
fi

echo 'staging env serialization tests passed'
