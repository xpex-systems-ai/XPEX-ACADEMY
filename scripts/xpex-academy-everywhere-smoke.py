#!/usr/bin/env python3
"""Read-only smoke checks for Academy Everywhere preview; no learner data or secrets."""
import argparse
import json
import sys
import urllib.error
import urllib.request


def request(url, body=None):
    headers = {"Accept": "application/json", "User-Agent": "XPeX-Academy-Preview-Smoke/1.0"}
    if body is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(body).encode()
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status, json.loads(resp.read(65536))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, help="Approved preview URL, not production")
    args = parser.parse_args()
    base = args.base.rstrip("/")
    if not base.startswith("https://"):
        parser.error("HTTPS is required")
    failures = []
    for path in ("/api/health", "/api/xpex/everywhere"):
        try:
            status, data = request(base + path)
            ok = status == 200 and isinstance(data, dict)
            if path.endswith("everywhere"):
                ok = ok and data.get("product") == "XPeX Academy Everywhere — Learning OS"
            print(f"{'PASS' if ok else 'FAIL'} GET {path}: HTTP {status}")
            if not ok:
                failures.append(path)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            print(f"FAIL GET {path}: {type(exc).__name__}")
            failures.append(path)
    endpoint = base + "/api/xpex/everywhere/mcp"
    for method, params in (("initialize", {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "xpex-smoke", "version": "0.1"}}), ("tools/list", {}), ("tools/call", {"name": "academy_get_capabilities", "arguments": {}})):
        try:
            status, data = request(endpoint, {"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
            ok = status == 200 and data.get("jsonrpc") == "2.0" and "result" in data
            if method == "tools/list":
                ok = ok and any(t.get("name") == "academy_get_capabilities" for t in data.get("result", {}).get("tools", []))
            print(f"{'PASS' if ok else 'FAIL'} MCP {method}: HTTP {status}")
            if not ok:
                failures.append(method)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            print(f"FAIL MCP {method}: {type(exc).__name__}")
            failures.append(method)
    if failures:
        print("Preview NOT validated. Failed checks:", ", ".join(failures))
        return 1
    print("Public preview smoke passed; this does NOT validate login, Polo, database, or student journeys.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
