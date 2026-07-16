import logging
from typing import Optional

from langchain_community.embeddings import HuggingFaceEmbeddings

from app.config import settings

logger = logging.getLogger(__name__)

_embedding_model: Optional[HuggingFaceEmbeddings] = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    """
    Return a singleton HuggingFace embedding model.
    Uses sentence-transformers/all-MiniLM-L6-v2.
    """
    global _embedding_model

    if _embedding_model is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _embedding_model = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        logger.info("Embedding model loaded successfully.")

    return _embedding_model
