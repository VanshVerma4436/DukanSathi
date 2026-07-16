import logging
import os
from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.config import settings

logger = logging.getLogger(__name__)


def load_and_split_pdfs(file_paths: List[str]) -> List[Document]:
    """
    Load PDFs from disk, split into chunks, and attach metadata.

    Args:
        file_paths: List of absolute paths to PDF files.

    Returns:
        List of LangChain Document objects with metadata:
            - source: original filename
            - page: 1-indexed page number
            - chunk_id: sequential chunk identifier
    """
    all_documents: List[Document] = []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    for file_path in file_paths:
        pdf_name = Path(file_path).name
        logger.info(f"Loading PDF: {pdf_name}")

        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()

            for page in pages:
                # Normalize page number to 1-indexed
                raw_page = page.metadata.get("page", 0)
                page_number = raw_page + 1 if isinstance(raw_page, int) else 1

                page.metadata["source"] = pdf_name
                page.metadata["page"] = page_number

            chunks = splitter.split_documents(pages)

            # Attach chunk_id and propagate clean metadata
            for idx, chunk in enumerate(chunks):
                chunk.metadata["chunk_id"] = idx
                chunk.metadata["source"] = chunk.metadata.get("source", pdf_name)
                chunk.metadata["page"] = chunk.metadata.get("page", 1)

            all_documents.extend(chunks)
            logger.info(
                f"Processed {pdf_name}: {len(pages)} pages → {len(chunks)} chunks"
            )

        except Exception as exc:
            logger.error(f"Failed to process {pdf_name}: {exc}", exc_info=True)
            raise RuntimeError(f"Could not process PDF '{pdf_name}': {exc}") from exc

    logger.info(f"Total chunks across all documents: {len(all_documents)}")
    return all_documents
