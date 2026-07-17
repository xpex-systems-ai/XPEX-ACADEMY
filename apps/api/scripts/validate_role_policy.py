#!/usr/bin/env python
"""Dry-run a Role.rights candidate policy without database access."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API_ROOT = ROOT / "apps" / "api"
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from src.security.role_policy_validator import validate_role_policy  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("policy", type=Path, help="Path to a role policy JSON file")
    args = parser.parse_args()

    with args.policy.open(encoding="utf-8") as handle:
        policy = json.load(handle)

    result = validate_role_policy(policy)
    print(result.model_dump_json(indent=2))
    return 0 if result.valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
