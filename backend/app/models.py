from pydantic import BaseModel, Field
from typing import List, Optional


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User question")


class SourceDocument(BaseModel):
    document: str = Field(..., description="Source PDF filename")
    page: int = Field(..., description="Page number (1-indexed)")
    content: str = Field(..., description="Relevant text chunk")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI-generated answer")
    sources: List[SourceDocument] = Field(
        default_factory=list, description="Retrieved source documents"
    )


class UploadResponse(BaseModel):
    message: str
    files_processed: List[str]
    total_chunks: int


class HealthResponse(BaseModel):
    status: str
    vector_store_loaded: bool
    document_count: Optional[int] = None
