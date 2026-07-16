import logging
import os
from typing import List, Optional, Tuple

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI

from app.config import settings
from app.embeddings import get_embedding_model
from app.prompt import rag_prompt
from app.models import SourceDocument

logger = logging.getLogger(__name__)

# In-memory FAISS vector store (persisted to disk after indexing)
_vector_store: Optional[FAISS] = None


# ---------------------------------------------------------------------------
# Vector Store Management
# ---------------------------------------------------------------------------


def build_vector_store(documents: List[Document]) -> FAISS:
    """
    Build a new FAISS vector store from the provided documents and persist it.

    Args:
        documents: List of LangChain Documents with metadata.

    Returns:
        FAISS vector store instance.
    """
    global _vector_store

    logger.info(f"Building FAISS index from {len(documents)} chunks...")
    embeddings = get_embedding_model()

    _vector_store = FAISS.from_documents(documents, embeddings)

    # Persist to disk so it survives server restarts
    os.makedirs(settings.VECTORSTORE_DIR, exist_ok=True)
    _vector_store.save_local(settings.VECTORSTORE_DIR)
    logger.info(f"FAISS index saved to '{settings.VECTORSTORE_DIR}'")

    return _vector_store


def load_vector_store() -> Optional[FAISS]:
    """
    Attempt to load a persisted FAISS index from disk.
    Returns None if no index exists yet.
    """
    global _vector_store

    index_file = os.path.join(settings.VECTORSTORE_DIR, "index.faiss")
    if not os.path.exists(index_file):
        logger.info("No persisted FAISS index found.")
        return None

    logger.info(f"Loading FAISS index from '{settings.VECTORSTORE_DIR}'...")
    embeddings = get_embedding_model()
    _vector_store = FAISS.load_local(
        settings.VECTORSTORE_DIR,
        embeddings,
        allow_dangerous_deserialization=True,
    )
    logger.info("FAISS index loaded successfully.")
    return _vector_store


def get_vector_store() -> Optional[FAISS]:
    """Return the current in-memory vector store (may be None)."""
    return _vector_store


def is_vector_store_loaded() -> bool:
    return _vector_store is not None


# ---------------------------------------------------------------------------
# RAG Pipeline
# ---------------------------------------------------------------------------


def _build_llm() -> ChatOpenAI:
    """Instantiate a LangChain ChatOpenAI client pointed at OpenRouter."""
    return ChatOpenAI(
        model=settings.OPENROUTER_MODEL,
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        temperature=0.1,
        max_tokens=1024,
        default_headers={
            "HTTP-Referer": "https://dukansathi.ai",
            "X-Title": "DukanSathi",
        },
    )


def retrieve_and_answer(question: str) -> Tuple[str, List[SourceDocument]]:
    """
    Core RAG pipeline:
    1. Embed the question.
    2. Similarity-search FAISS for top-K chunks.
    3. Build context string.
    4. Call OpenRouter LLM with prompt.
    5. Return answer + source citations.

    Args:
        question: The customer's question string.

    Returns:
        Tuple of (answer_text, list_of_SourceDocument).

    Raises:
        RuntimeError: If no vector store is loaded.
    """
    # FIXED: Properly indented this entire setup block inside the function body
    store = get_vector_store()

    if store is None:
        store = load_vector_store()

    if store is None:
        raise RuntimeError(
            "No documents have been uploaded yet. "
            "Please upload PDFs before asking questions."
        )

    # --- 1. Retrieve top-K relevant chunks ---
    logger.info(f"Searching vector store for: '{question}'")
    results: List[Tuple[Document, float]] = store.similarity_search_with_score(
        question, k=settings.TOP_K_RESULTS
    )

    if not results:
        return (
            "I couldn't find this information in the uploaded documents.",
            [],
        )

    # --- 2. Build context and source list ---
    context_parts: List[str] = []
    sources: List[SourceDocument] = []

    for rank, (doc, score) in enumerate(results, start=1):
        doc_name = doc.metadata.get("source", "Unknown Document")
        page_num = doc.metadata.get("page", 1)
        content = doc.page_content.strip()

        context_parts.append(
            f"[Source {rank}] Document: {doc_name} | Page: {page_num}\n{content}"
        )

        sources.append(
            SourceDocument(
                document=doc_name,
                page=page_num,
                content=content[:500],  # Truncate very long chunks for UI display
            )
        )

    context = "\n\n---\n\n".join(context_parts)

    # --- 3. Call LLM ---
    logger.info("Sending query to OpenRouter LLM...")
    llm = _build_llm()
    chain = rag_prompt | llm

    response = chain.invoke({"context": context, "question": question})
    answer = response.content.strip()

    logger.info("LLM response received successfully.")
    return answer, sources
