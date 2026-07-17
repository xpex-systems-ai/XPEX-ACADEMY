#!/bin/bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
API_DIR="${ROOT_DIR}/apps/api"
TEST_TMP=$(mktemp -d)
trap 'rm -rf "${TEST_TMP}"' EXIT

assert_eq() {
    local expected=$1
    local actual=$2
    local message=$3
    if [ "$expected" != "$actual" ]; then
        echo "not ok - ${message}: expected '${expected}', got '${actual}'" >&2
        exit 1
    fi
}

assert_contains() {
    local needle=$1
    local file=$2
    local message=$3
    if ! grep -F -- "$needle" "$file" >/dev/null; then
        echo "not ok - ${message}: missing '${needle}'" >&2
        cat "$file" >&2
        exit 1
    fi
}

assert_fails() {
    local message=$1
    shift
    if "$@" >"${TEST_TMP}/unexpected.out" 2>"${TEST_TMP}/unexpected.err"; then
        echo "not ok - ${message}: command unexpectedly succeeded" >&2
        cat "${TEST_TMP}/unexpected.out" >&2
        cat "${TEST_TMP}/unexpected.err" >&2
        exit 1
    fi
}

resolve_port() {
    (cd "$API_DIR" && env -i PATH="$PATH" "$@" bash ./resolve-container-port.sh)
}

assert_eq "8080" "$(resolve_port PORT=8080 LEARNHOUSE_PORT=9000)" "PORT takes precedence over LEARNHOUSE_PORT"
assert_eq "9100" "$(resolve_port LEARNHOUSE_PORT=9100)" "LEARNHOUSE_PORT fallback is preserved"
assert_eq "9000" "$(resolve_port)" "default fallback is 9000"
assert_eq "9200" "$(resolve_port PORT= LEARNHOUSE_PORT=9200)" "empty PORT falls back to LEARNHOUSE_PORT"
assert_eq "1" "$(resolve_port PORT=1 LEARNHOUSE_PORT=9000)" "low boundary port is valid"
assert_eq "65535" "$(resolve_port PORT=65535 LEARNHOUSE_PORT=9000)" "high boundary port is valid"
assert_fails "non-numeric PORT is rejected" env PORT=abc bash "$API_DIR/resolve-container-port.sh"
assert_fails "zero PORT is rejected" env PORT=0 bash "$API_DIR/resolve-container-port.sh"
assert_fails "high PORT is rejected" env PORT=65536 bash "$API_DIR/resolve-container-port.sh"

STUB_BIN="${TEST_TMP}/bin"
mkdir -p "$STUB_BIN"
cat >"${STUB_BIN}/uv" <<'STUB'
#!/bin/bash
printf '%q ' "$@" >"${UV_CAPTURE_FILE}"
printf '\n' >>"${UV_CAPTURE_FILE}"
exit 0
STUB
chmod +x "${STUB_BIN}/uv"
UV_CAPTURE_FILE="${TEST_TMP}/uv.args" HOSTNAME="container-random-name" PORT=8080 LEARNHOUSE_PORT=9000 \
    PATH="${STUB_BIN}:${PATH}" bash "$API_DIR/docker-entrypoint.sh" >"${TEST_TMP}/entrypoint.out"
assert_contains "--host 0.0.0.0 --port 8080" "${TEST_TMP}/uv.args" "entrypoint binds to 0.0.0.0 and provider port"
assert_contains "Starting LearnHouse backend on 0.0.0.0:8080" "${TEST_TMP}/entrypoint.out" "startup log avoids HOSTNAME bind"

cat >"${STUB_BIN}/curl" <<'STUB'
#!/bin/bash
printf '%s\n' "$*" >"${CURL_CAPTURE_FILE}"
exit 0
STUB
chmod +x "${STUB_BIN}/curl"
CURL_CAPTURE_FILE="${TEST_TMP}/curl.args" PORT=8080 LEARNHOUSE_PORT=9000 \
    PATH="${STUB_BIN}:${PATH}" bash "$API_DIR/docker-healthcheck.sh"
assert_contains "http://127.0.0.1:8080/api/v1/health" "${TEST_TMP}/curl.args" "healthcheck uses effective provider port"

printf 'ok - 12 container runtime checks passed\n'
