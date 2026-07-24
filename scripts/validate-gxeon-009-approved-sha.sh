#!/usr/bin/env bash
set -euo pipefail

AUDIT_NOTE="${1:-docs/xpex/staging-configuration/GXEON-009_PLAN_ONLY_AUDIT.md}"
REMOTE_REF="${REMOTE_REF:-origin/dev}"

[[ -f "$AUDIT_NOTE" ]] || { echo "NO-GO: audit note not found: $AUDIT_NOTE" >&2; exit 20; }

approved_sha="$(awk -F'`' '/Approved workflow_dispatch commit SHA:/ { print $2; exit }' "$AUDIT_NOTE")"
[[ "$approved_sha" =~ ^[0-9a-f]{40}$ ]] || { echo "NO-GO: approved SHA is missing or not a full lowercase 40-character SHA" >&2; exit 20; }

git cat-file -e "$approved_sha^{commit}" || { echo "NO-GO: approved SHA does not exist as a commit: $approved_sha" >&2; exit 20; }
git rev-parse --verify --quiet "$REMOTE_REF^{commit}" >/dev/null || { echo "NO-GO: remote dev ref not available: $REMOTE_REF" >&2; exit 20; }
git merge-base --is-ancestor "$approved_sha" "$REMOTE_REF" || { echo "NO-GO: approved SHA is not in $REMOTE_REF history: $approved_sha" >&2; exit 20; }

printf 'APPROVED_SHA=%s\n' "$approved_sha"
printf 'REMOTE_REF=%s\n' "$REMOTE_REF"
printf 'RESULT=GO_FOR_PLAN_ONLY_AUDIT_SHA\n'
