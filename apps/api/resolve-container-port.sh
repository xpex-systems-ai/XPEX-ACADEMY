#!/bin/bash
set -euo pipefail

# Resolve the API container port from the provider contract.
# Precedence: PORT > LEARNHOUSE_PORT > 9000.
resolve_container_port() {
    local effective_port="${PORT:-}"

    if [ -z "$effective_port" ]; then
        effective_port="${LEARNHOUSE_PORT:-}"
    fi

    if [ -z "$effective_port" ]; then
        effective_port="9000"
    fi

    if [[ ! "$effective_port" =~ ^[0-9]+$ ]]; then
        echo "Error: effective API port must be a decimal integer between 1 and 65535" >&2
        return 1
    fi

    if [ "$effective_port" -lt 1 ] || [ "$effective_port" -gt 65535 ]; then
        echo "Error: effective API port must be between 1 and 65535" >&2
        return 1
    fi

    printf '%s\n' "$effective_port"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    resolve_container_port
fi
