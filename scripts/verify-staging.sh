#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STAGING_URL:-}}"
ORIGIN="${2:-${STAGING_ORIGIN:-https://staging.example.com}}"
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 https://staging-api.example.com [https://staging.example.com]" >&2
  exit 1
fi

"$(dirname "$0")/verify-staging-deployment.sh" "$BASE_URL" "$ORIGIN"
