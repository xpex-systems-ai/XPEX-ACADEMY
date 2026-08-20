#!/bin/sh
set -eu

template=${1:?nginx template path is required}
output=${2:?nginx output path is required}
public_port=${3:-${PORT:-80}}
web_port=${4:-${WEB_PORT:-8000}}

case "$public_port" in
    ''|*[!0-9]*) echo "PORT must be numeric" >&2; exit 1 ;;
esac

# The checked-in nginx configuration routes frontend traffic to port 8000.
# Fail closed instead of accepting an override that would silently disconnect
# nginx from Next.js.
if [ "$web_port" != "8000" ]; then
    echo "WEB_PORT is fixed at 8000 in the combined container" >&2
    exit 1
fi

if [ "$public_port" = "$web_port" ]; then
    echo "PORT and WEB_PORT must be different in the combined container" >&2
    exit 1
fi

sed \
    -e "s/listen 80;/listen ${public_port};/" \
    -e "s/listen \[::\]:80;/listen [::]:${public_port};/" \
    "$template" > "$output"
