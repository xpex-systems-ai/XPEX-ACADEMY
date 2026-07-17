#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=apps/api/resolve-container-port.sh
source "${SCRIPT_DIR}/resolve-container-port.sh"

API_PORT=$(resolve_container_port)
HEALTH_URL="http://127.0.0.1:${API_PORT}/api/v1/health"

curl -fsS "$HEALTH_URL" >/dev/null
