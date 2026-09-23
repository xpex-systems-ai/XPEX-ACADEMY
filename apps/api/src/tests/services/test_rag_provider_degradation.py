"""Regression coverage for controlled RAG provider/embedding degradation."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

from src.routers.ai import rag as rag_router
from src.services.ai.rag import query_service


async def _collect_text(stream):
    return "".join([chunk async for chunk in stream])


async def test_query_course_rag_stream_degrades_on_embedding_runtime_error():
    with patch.object(
        query_service,
        "query_course_rag",
        new_callable=AsyncMock,
        side_effect=RuntimeError("Hugging Face embeddings request failed with HTTP 402"),
    ):
        stream, sources, provider_unavailable = await query_service.query_course_rag_stream(
            question="Qual a diferença?",
            org_id=10,
            db_session=AsyncMock(),
            message_history=[],
            course_id=1,
            mode="course_only",
        )

    text = await _collect_text(stream)

    assert provider_unavailable is True
    assert sources == []
    assert "temporariamente indisponível" in text
    assert "HTTP 402" not in text


async def test_provider_unavailable_sse_skips_optional_ai_and_does_not_double_refund():
    async def unavailable_stream():
        yield "O assistente GX está temporariamente indisponível."

    with patch.object(rag_router, "save_message_to_history"), patch.object(
        rag_router,
        "generate_follow_up_suggestions",
        new_callable=AsyncMock,
    ) as follow_ups, patch.object(
        rag_router,
        "generate_chat_title",
        new_callable=AsyncMock,
    ) as title, patch.object(
        rag_router,
        "update_chat_session_meta",
    ), patch(
        "src.security.features_utils.usage.refund_ai_credit"
    ) as refund:
        events = [
            json.loads(item.replace("data: ", "").strip())
            async for item in rag_router.rag_chat_event_generator(
                unavailable_stream(),
                aichat_uuid="chat_1",
                user_message="Pergunta",
                sources=[],
                context_text="Pergunta",
                ai_model="model",
                user_id=7,
                course_uuid="course_1",
                is_new_session=True,
                mode="course_only",
                org_id=10,
                provider_unavailable=True,
            )
            if item.startswith("data: ")
        ]

    assert [event["type"] for event in events] == ["start", "chunk", "done"]
    follow_ups.assert_not_awaited()
    title.assert_not_awaited()
    refund.assert_not_called()
