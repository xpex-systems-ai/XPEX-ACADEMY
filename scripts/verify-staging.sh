#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STAGING_URL:-}}"
ORIGIN="${2:-${STAGING_ORIGIN:-https://staging.example.com}}"
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 https://staging-api.example.com [https://staging.example.com]" >&2
  exit 1
fi
BASE_URL="${BASE_URL%/}"

curl -fsS "$BASE_URL/api/v1/health" | tee /tmp/xpex-health.json
curl -fsSI -X OPTIONS "$BASE_URL/api/v1/health" -H "Origin: $ORIGIN" -H "Access-Control-Request-Method: GET" | tee /tmp/xpex-cors.headers
if ! rg -i '^access-control-allow-origin:' /tmp/xpex-cors.headers >/dev/null; then
  echo "CORS preflight did not return access-control-allow-origin" >&2
  exit 1
fi

echo "Staging health and CORS checks passed for $BASE_URL"
