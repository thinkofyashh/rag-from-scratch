from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import AnyHttpUrl, Field, NonNegativeInt, PositiveInt

from asklearnly.schemas.base import ApiModel


class IndexStatus(StrEnum):
    NOT_INDEXED = "not_indexed"
    INDEXING = "indexing"
    INDEXED = "indexed"
    STALE = "stale"
    FAILED = "failed"


VectorBackend = Literal["memory", "pgvector"]


class SourceDocument(ApiModel):
    id: PositiveInt
    slug: str = Field(min_length=1)
    title: str = Field(min_length=1)
    topics: list[str] = Field(default_factory=list)
    page_count: PositiveInt
    chunk_count: NonNegativeInt
    preview_url: AnyHttpUrl
    index_status: IndexStatus
    index_error: str | None = None
    checksum: str = Field(min_length=1)
    updated_at: datetime
    indexed_at: datetime | None = None


class SourceListResponse(ApiModel):
    items: list[SourceDocument] = Field(default_factory=list)
    embedding_model: str = Field(min_length=1)
    embedding_dimensions: PositiveInt
    vector_backend: VectorBackend
