import logging
import os
import shutil
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import settings
from app.models import ChatRequest, ChatResponse, HealthResponse, UploadResponse
from app.pdf_loader import load_and_split_pdfs
from app.rag import (
    build_vector_store,
    is_vector_store_loaded,
    get_vector_store,
    retrieve_and_answer,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Returns API liveness status and vector store state."""
    store = get_vector_store()
    doc_count: int | None = None
    if store is not None:
        try:
            doc_count = store.index.ntotal
        except Exception:
            doc_count = None

    return HealthResponse(
        status="ok",
        vector_store_loaded=is_vector_store_loaded(),
        document_count=doc_count,
    )


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
    tags=["Documents"],
)
async def upload_documents(files: List[UploadFile] = File(...)) -> UploadResponse:
    """
    Accept one or more PDF files, save them, process into chunks,
    and build/rebuild the FAISS vector store.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No files were provided.",
        )

    # Validate all files are PDFs
    for f in files:
        if not f.filename or not f.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{f.filename}' is not a PDF. Only PDF files are accepted.",
            )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    saved_paths: List[str] = []
    processed_names: List[str] = []

    try:
        for upload_file in files:
            dest_path = os.path.join(settings.UPLOAD_DIR, upload_file.filename)
            with open(dest_path, "wb") as out_file:
                shutil.copyfileobj(upload_file.file, out_file)
            saved_paths.append(dest_path)
            processed_names.append(upload_file.filename)
            logger.info(f"Saved uploaded file: {upload_file.filename}")

        # Load & chunk
        documents = load_and_split_pdfs(saved_paths)

        if not documents:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The uploaded PDFs appear to be empty or unreadable.",
            )

        # Build FAISS index
        build_vector_store(documents)

        return UploadResponse(
            message=f"Successfully processed {len(files)} document(s).",
            files_processed=processed_names,
            total_chunks=len(documents),
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Upload failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process documents: {str(exc)}",
        ) from exc


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["Chat"],
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Accept a customer question, run RAG pipeline, and return
    an answer with source citations.
    """
    if not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question cannot be empty.",
        )

    if not is_vector_store_loaded():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents uploaded yet. Please upload PDFs first.",
        )

    try:
        answer, sources = retrieve_and_answer(request.question.strip())
        return ChatResponse(answer=answer, sources=sources)

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except Exception as exc:
        logger.error(f"Chat error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating the response: {str(exc)}",
        ) from exc
