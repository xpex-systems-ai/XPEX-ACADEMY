#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"
ALLOWED_ORIGIN="${2:-}"
DISALLOWED_ORIGIN="${3:-https://not-allowed.example.test}"
EXPECTED_HEALTH_JSON="${EXPECTED_HEALTH_JSON:-true}"

usage() {
  echo "Usage: $0 https://staging-api.example.test https://staging.example.test [https://bad.example.test]" >&2
}

if [[ -z "$BASE_URL" || -z "$ALLOWED_ORIGIN" ]]; then
  usage
  exit 2
fi
if [[ !( "$BASE_URL" == https://* || "$BASE_URL" == http://127.0.0.1:* || "$BASE_URL" == http://localhost:* ) || "$BASE_URL" =~ (prod|production) ]]; then
  usage
  exit 2
fi

BASE_URL="${BASE_URL%/}"
health_body="$(mktemp)"
health_headers="$(mktemp)"
cors_allowed="$(mktemp)"
cors_denied="$(mktemp)"
missing_headers="$(mktemp)"
cleanup() { rm -f "$health_body" "$health_headers" "$cors_allowed" "$cors_denied" "$missing_headers"; }
trap cleanup EXIT

start=$(date +%s%3N)
code=$(curl -sS -o "$health_body" -D "$health_headers" -w '%{http_code}' "$BASE_URL/api/v1/health")
end=$(date +%s%3N)
ms=$((end-start))
[[ "$code" == 200 ]] || { echo "Health returned HTTP $code" >&2; exit 1; }
python3 - "$health_body" "$EXPECTED_HEALTH_JSON" <<'PY'
import json
import sys
from pathlib import Path
body_path, expected_raw = sys.argv[1], sys.argv[2]
actual = json.loads(Path(body_path).read_text(encoding='utf-8'))
expected = json.loads(expected_raw)
if actual != expected:
    raise SystemExit(f"Health JSON mismatch: expected {expected!r}, got {actual!r}")
PY

curl -fsSI -X OPTIONS "$BASE_URL/api/v1/health" -H "Origin: $ALLOWED_ORIGIN" -H "Access-Control-Request-Method: GET" > "$cors_allowed"
allowed_header="$(awk 'BEGIN{IGNORECASE=1} /^access-control-allow-origin:/ {sub(/^[^:]+:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit}' "$cors_allowed")"
if [[ "$allowed_header" != "$ALLOWED_ORIGIN" && "$allowed_header" != "*" ]]; then
  echo "Allowed origin CORS header missing or unexpected: ${allowed_header:-<absent>}" >&2
  exit 1
fi

curl -sSI -X OPTIONS "$BASE_URL/api/v1/health" -H "Origin: $DISALLOWED_ORIGIN" -H "Access-Control-Request-Method: GET" > "$cors_denied" || true
denied_header="$(awk 'BEGIN{IGNORECASE=1} /^access-control-allow-origin:/ {sub(/^[^:]+:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit}' "$cors_denied")"
if [[ "$denied_header" == "$DISALLOWED_ORIGIN" ]]; then
  echo "Disallowed origin was allowed" >&2
  exit 1
fi

missing_code=$(curl -sS -o /dev/null -D "$missing_headers" -w '%{http_code}' "$BASE_URL/__xpex_missing_route__")
[[ "$missing_code" =~ ^(404|405)$ ]] || { echo "Missing route returned unexpected HTTP $missing_code" >&2; exit 1; }

echo "Verification passed: health HTTP $code, response ${ms}ms, JSON $EXPECTED_HEALTH_JSON, CORS allowed/denied behavior, and 404/405 route handling validated."
