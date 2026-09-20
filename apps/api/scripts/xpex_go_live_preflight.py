"""Read-only production go-live preflight for XPeX Academy.

This command never prints secret values and never mutates application data.
It validates environment requirements for real students and delegates to the
existing XPeX readiness scripts in dry-run mode.

Usage:
    PYTHONPATH=/app/api .venv/bin/python scripts/xpex_go_live_preflight.py
    PYTHONPATH=/app/api .venv/bin/python scripts/xpex_go_live_preflight.py --require-ai
    PYTHONPATH=/app/api .venv/bin/python scripts/xpex_go_live_preflight.py --require-payments
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Check:
    name: str
    ok: bool
    severity: str
    detail: str


def _present(name: str) -> bool:
    return bool((os.getenv(name) or "").strip())


def _false_like(name: str) -> bool:
    return (os.getenv(name) or "").strip().lower() in {"", "0", "false", "no", "off"}


def _run_read_only(label: str, command: list[str]) -> Check:
    result = subprocess.run(command, text=True, capture_output=True, check=False)
    if result.returncode == 0:
        return Check(label, True, "P0", "PASS")
    # Do not echo full child stdout/stderr because downstream tools may change
    # their logging later. Keep this bounded and non-sensitive.
    return Check(label, False, "P0", f"BLOCKED exit={result.returncode}")


def _environment_checks(require_ai: bool, require_payments: bool) -> list[Check]:
    checks: list[Check] = []

    required = {
        "LEARNHOUSE_AUTH_JWT_SECRET_KEY": "JWT signing secret",
        "LEARNHOUSE_SQL_CONNECTION_STRING": "PostgreSQL connection",
        "LEARNHOUSE_REDIS_CONNECTION_STRING": "Redis connection",
        "LEARNHOUSE_BREVO_API_KEY": "transactional email provider",
        "LEARNHOUSE_SYSTEM_EMAIL_ADDRESS": "system sender email",
    }
    for env_name, purpose in required.items():
        checks.append(
            Check(
                env_name,
                _present(env_name),
                "P0",
                f"required for {purpose}",
            )
        )

    env_name = (os.getenv("LEARNHOUSE_ENV") or "").strip().lower()
    checks.append(
        Check(
            "LEARNHOUSE_ENV",
            env_name in {"prod", "production"},
            "P0",
            "must be prod/production",
        )
    )
    checks.append(
        Check(
            "LEARNHOUSE_DEVELOPMENT_MODE",
            _false_like("LEARNHOUSE_DEVELOPMENT_MODE"),
            "P0",
            "must be disabled",
        )
    )
    checks.append(
        Check(
            "ALLOW_PILOT_BOOTSTRAP",
            _false_like("ALLOW_PILOT_BOOTSTRAP"),
            "P1",
            "must remain disabled for public production",
        )
    )

    if require_ai:
        provider = (os.getenv("LEARNHOUSE_AI_PROVIDER") or "").strip().lower()
        embedding_provider = (
            os.getenv("LEARNHOUSE_AI_EMBEDDING_PROVIDER") or ""
        ).strip().lower()
        ai_enabled = (os.getenv("LEARNHOUSE_IS_AI_ENABLED") or "").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        checks.append(Check("LEARNHOUSE_IS_AI_ENABLED", ai_enabled, "P1", "AI launch requested"))
        checks.append(Check("LEARNHOUSE_AI_PROVIDER", bool(provider), "P1", "provider must be selected"))

        if provider == "openrouter":
            llm_credential_ok = _present("LEARNHOUSE_AI_API_KEY") or _present(
                "OPENROUTER_API_KEY"
            )
            llm_detail = (
                "OpenRouter credential via LEARNHOUSE_AI_API_KEY or OPENROUTER_API_KEY"
            )
        elif provider == "bedrock":
            llm_credential_ok = True
            llm_detail = "Bedrock uses the AWS credential chain"
        elif provider == "ollama":
            llm_credential_ok = True
            llm_detail = "Ollama does not require a hosted provider key"
        elif provider in {"google", "google-gla", "gemini"}:
            llm_credential_ok = _present("LEARNHOUSE_AI_API_KEY") or _present(
                "LEARNHOUSE_GEMINI_API_KEY"
            )
            llm_detail = "Google credential"
        else:
            llm_credential_ok = _present("LEARNHOUSE_AI_API_KEY")
            llm_detail = "LLM provider credential"

        checks.append(Check("AI_LLM_CREDENTIAL", llm_credential_ok, "P1", llm_detail))

        effective_embedding_provider = embedding_provider or provider
        if effective_embedding_provider in {"google", "google-gla", "gemini"}:
            embedding_ok = _present("LEARNHOUSE_GEMINI_API_KEY") or (
                provider in {"google", "google-gla", "gemini"}
                and _present("LEARNHOUSE_AI_API_KEY")
            )
            embedding_detail = "Google embeddings credential"
        elif effective_embedding_provider in {
            "openai",
            "openai-compatible",
            "azure",
            "together",
        }:
            embedding_ok = _present("LEARNHOUSE_AI_API_KEY")
            embedding_detail = "OpenAI-family embeddings credential"
        elif effective_embedding_provider == "ollama":
            embedding_ok = True
            embedding_detail = "local Ollama embeddings"
        elif effective_embedding_provider in {"hf", "huggingface", "hugging-face"}:
            embedding_ok = _present("HF_TOKEN")
            embedding_detail = (
                "Hugging Face Inference Providers feature-extraction credential"
            )
        else:
            # Providers without an embeddings API fall back to Google.
            embedding_ok = _present("LEARNHOUSE_GEMINI_API_KEY")
            embedding_detail = (
                f"{effective_embedding_provider or 'selected provider'} has no native core "
                "embeddings path; configure LEARNHOUSE_GEMINI_API_KEY or a supported "
                "LEARNHOUSE_AI_EMBEDDING_PROVIDER"
            )

        checks.append(Check("AI_RAG_EMBEDDINGS", embedding_ok, "P1", embedding_detail))

    if require_payments:
        payment_vars = {
            "MERCADOPAGO_ACCESS_TOKEN": "provider access token",
            "MERCADOPAGO_WEBHOOK_SECRET": "webhook signature validation",
            "MERCADOPAGO_NOTIFICATION_URL": "canonical HTTPS webhook URL",
        }
        for env_name, purpose in payment_vars.items():
            checks.append(Check(env_name, _present(env_name), "P1", purpose))

    return checks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--require-ai", action="store_true")
    parser.add_argument("--require-payments", action="store_true")
    args = parser.parse_args()

    checks = _environment_checks(args.require_ai, args.require_payments)

    python = sys.executable
    checks.append(
        _run_read_only(
            "assessment_schema_ready",
            [python, "scripts/xpex_assessment_schema_ready.py"],
        )
    )
    checks.append(
        _run_read_only(
            "first_student_flow_dry_run",
            [python, "scripts/xpex_first_student_flow.py"],
        )
    )

    p0_failed = [c for c in checks if not c.ok and c.severity == "P0"]
    p1_failed = [c for c in checks if not c.ok and c.severity == "P1"]

    for check in checks:
        status = "PASS" if check.ok else "BLOCKED"
        print(f"{check.severity} {status} {check.name} detail={check.detail}")

    if p0_failed:
        print(
            "GO_LIVE=NO_GO "
            f"p0_blockers={len(p0_failed)} p1_blockers={len(p1_failed)}"
        )
        raise SystemExit(2)

    if p1_failed:
        print(
            "GO_LIVE=PILOT_ONLY "
            f"p0_blockers=0 p1_blockers={len(p1_failed)}"
        )
        raise SystemExit(1)

    print("GO_LIVE=READY p0_blockers=0 p1_blockers=0")


if __name__ == "__main__":
    main()
