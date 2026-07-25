#!/usr/bin/env bash

# Helpers for generating Bash-sourceable staging environment files. This file is
# intended to be sourced; it deliberately does not change the caller's shell options.

reject_unsafe_env_value() {
  local label="$1" value="$2"
  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    printf 'NO-GO: %s contains CR/LF\n' "$label" >&2
    return 20
  fi
  if printf '%s' "$value" | LC_ALL=C grep -q '[[:cntrl:]]'; then
    printf 'NO-GO: %s contains unsupported control characters\n' "$label" >&2
    return 20
  fi
}

append_bash_env() {
  local file="$1" name="$2" value="$3"
  [[ "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || {
    printf 'NO-GO: invalid environment variable name\n' >&2
    return 20
  }
  reject_unsafe_env_value "$name" "$value" || return 20
  printf '%s=%q\n' "$name" "$value" >> "$file"
}

validate_bash_env_round_trip() {
  local file="$1"
  shift

  bash -n "$file" || {
    printf 'NO-GO: temporary environment file failed Bash syntax validation\n' >&2
    return 20
  }

  local name
  for name in "$@"; do
    [[ "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || return 20
    env EXPECTED_ENV_VALUE="${!name-}" EXPECTED_ENV_NAME="$name" \
      bash -c 'set -euo pipefail; source "$1"; [[ "${!EXPECTED_ENV_NAME-}" == "$EXPECTED_ENV_VALUE" ]]' bash "$file" || {
        printf 'NO-GO: redacted round-trip comparison failed for %s\n' "$name" >&2
        return 20
      }
    printf 'OK: redacted round-trip comparison passed for %s\n' "$name"
  done
}
