#!/usr/bin/env python3
"""Read-only deployment configuration gate for Academy enrollment readiness.

Does not contact services, display secret values, or modify infrastructure.
Run with deployment environment variables injected by the hosting provider.
"""
from __future__ import annotations
import os
import sys
from urllib.parse import urlsplit

REQUIRED_PUBLIC = ("NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL",)


def main() -> int:
    errors = []
    for name in REQUIRED_PUBLIC:
        value = os.getenv(name, "").strip()
        if not value:
            errors.append(f"{name}: MISSING")
            continue
        try:
            url = urlsplit(value)
            valid = url.scheme == "https" and bool(url.hostname) and not url.username and not url.password
            if url.hostname in {"localhost", "127.0.0.1"}:
                valid = False
        except ValueError:
            valid = False
        if not valid:
            errors.append(f"{name}: INVALID HTTPS API URL")
        else:
            print(f"PASS: {name} is configured as HTTPS (value hidden)")
    if errors:
        for error in errors:
            print("BLOCKED:", error)
        print("Academy login/Polo/enrollment cannot be marked production-ready.")
        return 2
    print("CONFIG PASS: backend URL exists; API health, auth, tenancy and enrollment E2E are NOT yet verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
