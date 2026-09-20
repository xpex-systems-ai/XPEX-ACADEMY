"""Provider-agnostic embeddings for the XPeX/LearnHouse RAG layer.

Google, OpenAI-family providers and Ollama use Pydantic AI embedding models.
Hugging Face uses the official Inference Providers feature-extraction route through
an async HTTP client so an existing server-side HF_TOKEN can power RAG embeddings
without adding another SDK dependency.

The output dimensionality is pinned (default 768) to match the Vector(768)
pgvector column in CourseEmbedding. Changing embedding dimensions requires a DB
migration and full course re-index.
"""

from __future__ import annotations

import logging
import os
from urllib.parse import quote

import httpx
from config.config import get_learnhouse_config
from pydantic_ai.embeddings import Embedder, EmbeddingModel, EmbeddingSettings
from src.services.ai.llm.provider import (
    _GOOGLE_ALIASES,
    _OPENAI_ALIASES,
    DEFAULT_OLLAMA_BASE_URL,
    DEFAULT_PROVIDER,
    AINotConfiguredError,
)

logger = logging.getLogger(__name__)

DEFAULT_EMBEDDING_DIMENSIONS = 768
_HF_ALIASES = {"hf", "huggingface", "hugging-face"}
_HF_ROUTER_BASE = "https://router.huggingface.co/hf-inference/models"
_HF_DEFAULT_MODEL = "intfloat/multilingual-e5-base"

_DEFAULT_EMBEDDING_MODEL = {
    "google": "gemini-embedding-001",
    "openai": "text-embedding-3-small",
    "ollama": "nomic-embed-text",
    "huggingface": _HF_DEFAULT_MODEL,
}


def embedding_dimensions() -> int:
    cfg = get_learnhouse_config().ai_config
    return getattr(cfg, "embedding_dimensions", None) or DEFAULT_EMBEDDING_DIMENSIONS


def _resolve_embedding_provider(cfg) -> str:
    """Embeddings follow embedding_provider, else the main provider, else Google."""
    explicit = (getattr(cfg, "embedding_provider", None) or "").strip().lower()
    if explicit:
        return explicit
    return (getattr(cfg, "provider", None) or "").strip().lower() or DEFAULT_PROVIDER


def _hf_token() -> str:
    token = (os.getenv("HF_TOKEN") or "").strip()
    if not token:
        raise AINotConfiguredError(
            "Hugging Face embeddings require HF_TOKEN in the server environment."
        )
    return token


def _hf_model_name(cfg) -> str:
    return (getattr(cfg, "embedding_model", None) or _HF_DEFAULT_MODEL).strip()


def _hf_prepare_texts(texts: list[str], model_name: str, input_type: str) -> list[str]:
    """Apply E5 retrieval prefixes only for the E5 family."""
    if model_name.lower().startswith("intfloat/multilingual-e5"):
        prefix = "query: " if input_type == "query" else "passage: "
        return [text if text.startswith(prefix) else f"{prefix}{text}" for text in texts]
    return texts


async def _hf_embed(texts: list[str], *, input_type: str) -> list[list[float]]:
    if not texts:
        return []

    cfg = get_learnhouse_config().ai_config
    model_name = _hf_model_name(cfg)
    prepared = _hf_prepare_texts(texts, model_name, input_type)
    encoded_model = quote(model_name, safe="/-._")
    endpoint = (
        f"{_HF_ROUTER_BASE}/{encoded_model}/pipeline/feature-extraction"
    )

    payload = {
        "inputs": prepared,
        "normalize": True,
        "truncate": True,
    }
    headers = {
        "Authorization": f"Bearer {_hf_token()}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        logger.warning("Hugging Face embeddings request failed status=%s", status)
        raise RuntimeError(
            f"Hugging Face embeddings request failed with HTTP {status}"
        ) from exc
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Hugging Face embeddings request failed: %s", type(exc).__name__)
        raise RuntimeError("Hugging Face embeddings request failed") from exc

    if not isinstance(data, list) or len(data) != len(prepared):
        raise RuntimeError("Hugging Face embeddings returned an unexpected batch shape")

    expected_dimensions = embedding_dimensions()
    vectors: list[list[float]] = []
    for vector in data:
        if not isinstance(vector, list) or len(vector) != expected_dimensions:
            raise RuntimeError(
                "Hugging Face embeddings dimensions do not match the configured "
                f"vector store ({expected_dimensions})"
            )
        try:
            vectors.append([float(value) for value in vector])
        except (TypeError, ValueError) as exc:
            raise RuntimeError("Hugging Face embeddings returned non-numeric values") from exc

    return vectors


def build_embedding_model() -> EmbeddingModel:
    """Build a Pydantic AI embedding model for providers handled by that SDK."""
    cfg = get_learnhouse_config().ai_config
    prov = _resolve_embedding_provider(cfg)
    main_provider = (getattr(cfg, "provider", None) or "").strip().lower() or DEFAULT_PROVIDER
    api_key = getattr(cfg, "api_key", None)
    base_url = getattr(cfg, "base_url", None) or None
    model_name = getattr(cfg, "embedding_model", None)
    settings = EmbeddingSettings(dimensions=embedding_dimensions())

    if prov in _HF_ALIASES:
        raise AINotConfiguredError(
            "Hugging Face embeddings use the async embed_documents/embed_query path."
        )

    if prov in _GOOGLE_ALIASES:
        from pydantic_ai.embeddings.google import GoogleEmbeddingModel
        from pydantic_ai.providers.google import GoogleProvider

        key = getattr(cfg, "gemini_api_key", None) or (
            api_key if main_provider in _GOOGLE_ALIASES else None
        )
        if not key:
            raise AINotConfiguredError(
                "Google embeddings require an API key (set LEARNHOUSE_GEMINI_API_KEY)."
            )
        return GoogleEmbeddingModel(
            model_name or _DEFAULT_EMBEDDING_MODEL["google"],
            provider=GoogleProvider(api_key=key),
            settings=settings,
        )

    if prov == "ollama":
        from pydantic_ai.embeddings.openai import OpenAIEmbeddingModel
        from pydantic_ai.providers.ollama import OllamaProvider

        return OpenAIEmbeddingModel(
            model_name or _DEFAULT_EMBEDDING_MODEL["ollama"],
            provider=OllamaProvider(base_url=base_url or DEFAULT_OLLAMA_BASE_URL),
            settings=settings,
        )

    if prov in _OPENAI_ALIASES:
        from pydantic_ai.embeddings.openai import OpenAIEmbeddingModel
        from pydantic_ai.providers.openai import OpenAIProvider

        if not api_key:
            raise AINotConfiguredError(
                "OpenAI embeddings require an API key (set LEARNHOUSE_AI_API_KEY)."
            )
        return OpenAIEmbeddingModel(
            model_name or _DEFAULT_EMBEDDING_MODEL["openai"],
            provider=OpenAIProvider(api_key=api_key, base_url=base_url),
            settings=settings,
        )

    gemini_key = getattr(cfg, "gemini_api_key", None)
    if gemini_key:
        from pydantic_ai.embeddings.google import GoogleEmbeddingModel
        from pydantic_ai.providers.google import GoogleProvider

        logger.info(
            "Provider '%s' has no embeddings API; using Google embeddings for RAG.", prov
        )
        return GoogleEmbeddingModel(
            model_name or _DEFAULT_EMBEDDING_MODEL["google"],
            provider=GoogleProvider(api_key=gemini_key),
            settings=settings,
        )

    raise AINotConfiguredError(
        f"Provider '{prov}' has no embeddings API. Set LEARNHOUSE_AI_EMBEDDING_PROVIDER to "
        "'huggingface', 'google', 'openai', or 'ollama' with its credentials."
    )


def _embedder() -> Embedder:
    return Embedder(build_embedding_model())


async def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed document chunks and return one vector per input."""
    cfg = get_learnhouse_config().ai_config
    if _resolve_embedding_provider(cfg) in _HF_ALIASES:
        return await _hf_embed(texts, input_type="document")

    result = await _embedder().embed(texts, input_type="document")
    return [list(v) for v in result.embeddings]


async def embed_query(text: str) -> list[float]:
    """Embed a retrieval query."""
    cfg = get_learnhouse_config().ai_config
    if _resolve_embedding_provider(cfg) in _HF_ALIASES:
        vectors = await _hf_embed([text], input_type="query")
        return vectors[0]

    result = await _embedder().embed(text, input_type="query")
    return list(result.embeddings[0])
