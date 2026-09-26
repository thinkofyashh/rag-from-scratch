from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from asklearnly.schemas.source import IndexStatus, SourceDocument, SourceListResponse


def build_source(**changes: object) -> SourceDocument:
    data: dict[str, object] = {
        "id": 18,
        "slug": "attention-mechanisms",
        "title": "Attention mechanisms",
        "topics": ["Deep learning"],
        "page_count": 14,
        "chunk_count": 42,
        "preview_url": "http://localhost:8000/documents/18/preview",
        "index_status": "indexed",
        "index_error": None,
        "checksum": "a" * 64,
        "updated_at": datetime(2026, 9, 19, 8, 30, tzinfo=UTC),
        "indexed_at": datetime(2026, 9, 19, 8, 31, tzinfo=UTC),
    }

    data.update(changes)

    return SourceDocument.model_validate(data)


def test_source_document_accepts_valid_data() -> None:
    source = build_source()

    assert source.id == 18
    assert source.index_status is IndexStatus.INDEXED


def test_source_document_serializes_using_camel_case() -> None:
    source = build_source()

    payload = source.model_dump(mode="json", by_alias=True)

    assert payload["pageCount"] == 14
    assert payload["chunkCount"] == 42
    assert payload["indexStatus"] == "indexed"
    assert "page_count" not in payload


def test_source_document_rejects_negative_page_count() -> None:
    with pytest.raises(ValidationError):
        build_source(page_count=-1)


def test_source_document_rejects_unknown_index_status() -> None:
    with pytest.raises(ValidationError):
        build_source(index_status="unknown")


def test_source_list_response_serializes_contract() -> None:
    response = SourceListResponse(
        items=[build_source()],
        embedding_dimensions=1536,
        vector_backend="memory",
        embedding_model="text-embedding-3-small",
    )

    payload = response.model_dump(mode="json", by_alias=True)

    assert payload["embeddingModel"] == "text-embedding-3-small"
    assert payload["embeddingDimensions"] == 1536
    assert payload["vectorBackend"] == "memory"
    assert payload["items"][0]["pageCount"] == 14
