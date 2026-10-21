"""Single place that builds the LLM + embeddings clients from backend/.env.

Swapping provider later = change this file only.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _key() -> str:
    key = os.environ.get("LLM_API_KEY", "").strip()
    if not key:
        raise RuntimeError("LLM_API_KEY is empty. Put your key in backend/.env")
    return key


def get_llm(temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(model=os.environ.get("LLM_MODEL", "gemini-3.8-flash"),
                                  google_api_key=_key(), temperature=temperature)


EMBED_MODEL = "BAAI/bge-small-en-v1.5"  # ~130MB, runs locally, no key or quota


class LocalEmbeddings:
    """LangChain-style embeddings (embed_documents / embed_query) running on this machine."""

    def __init__(self, model: str = EMBED_MODEL):
        from fastembed import TextEmbedding  # imported lazily: first use downloads the model
        self._m = TextEmbedding(model_name=model)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [v.tolist() for v in self._m.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return next(iter(self._m.query_embed(text))).tolist()


_embeddings: LocalEmbeddings | None = None


def get_embeddings() -> LocalEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = LocalEmbeddings()
    return _embeddings


def text_of(message) -> str:
    """Gemini 3.x returns content as a list of blocks; flatten to plain text."""
    c = message.content
    if isinstance(c, str):
        return c
    return "".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in c).strip()
