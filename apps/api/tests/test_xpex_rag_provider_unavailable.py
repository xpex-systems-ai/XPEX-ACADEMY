from pathlib import Path


def test_rag_provider_unavailable_is_controlled_and_refunds_reserved_credit():
    source = Path("src/services/ai/rag/query_service.py").read_text(encoding="utf-8")

    assert "except AINotConfiguredError" in source
    assert "refund_ai_credit(org_id, 2)" in source
    assert "_provider_unavailable_stream" in source
    assert "temporariamente indisponível" in source
    assert "return _provider_unavailable_stream(), []" in source
