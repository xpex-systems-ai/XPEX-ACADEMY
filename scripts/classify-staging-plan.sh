#!/usr/bin/env bash
set -euo pipefail

if (($# == 0)); then
  echo "Usage: scripts/classify-staging-plan.sh EXIT_CODE [...]" >&2
  exit 20
fi

decision="GO"
for rc in "$@"; do
  [[ "$rc" =~ ^[0-9]+$ ]] || rc=255
  case "$rc" in
    0) ;;
    10) [[ "$decision" == "GO" ]] && decision="PENDÊNCIA EXTERNA" ;;
    20) decision="NO-GO" ;;
    *)
      printf 'NO-GO: unexpected check exit code: %s\n' "$rc" >&2
      decision="NO-GO"
      ;;
  esac
done

printf '%s\n' "$decision"
case "$decision" in
  GO) exit 0 ;;
  "PENDÊNCIA EXTERNA") exit 10 ;;
  *) exit 20 ;;
esac
