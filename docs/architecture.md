# AskLearnly architecture

## System boundary

AskLearnly is a companion to Learnly, not a replacement for it. Learnly owns PDF upload, publication, metadata, and preview URLs. AskLearnly reads only Learnly's public REST API and never connects to the Learnly database.

```text
Browser
  |
  v
Next.js frontend
  |  REST reads and mutations
  |  server-sent answer events
  v
FastAPI RAG service
  |
  +-- Learnly client -> published documents and PDF downloads
  +-- ingestion -> page loader -> chunks -> embedding provider
  +-- retrieval -> vector store + sparse index -> ranked evidence
  +-- generation -> cited context -> streamed answer
  +-- PostgreSQL/pgvector -> sources, chunks, metadata, vectors
```

## Ownership

- The frontend owns presentation, browser state, responsive behavior, accessibility, and stream rendering.
- The backend owns synchronization, validation, extraction, chunking, embeddings, storage, retrieval, generation, and provider secrets.
- `docs/api-contract.md` is the shared boundary. Neither application reaches into the other's implementation.

## Document synchronization

1. A user explicitly starts synchronization in AskLearnly.
2. The backend lists published documents from the configured Learnly API.
3. It downloads each searchable PDF through the document download URL.
4. A checksum identifies unchanged, changed, new, and removed sources.
5. Changed documents are extracted page by page, chunked, embedded, and upserted.
6. Removed documents delete their chunks and vectors.
7. The frontend refreshes the source list and displays the returned summary.

Scanned handwritten PDFs must be made OCR-searchable before they enter Learnly. OCR is intentionally outside this repository.

## Query lifecycle

1. The frontend sends a question, selected source IDs, retrieval strategy, top-K, score threshold, and recent session messages.
2. The backend embeds the current question with the active document embedding model.
3. The selected retriever returns ranked chunks after applying source filters.
4. The backend emits a `retrieval` event containing page-level citations.
5. Retrieved chunks are formatted as labelled context for the generation model.
6. Answer fragments arrive as `token` events, followed by one `done` event.
7. The browser stores the conversation only for the current page session.

## Reliability and security boundaries

- Provider keys, database credentials, and Learnly service configuration stay in the backend environment.
- The browser receives only public service URLs and document preview URLs.
- The frontend treats every stream event as untrusted input and validates its shape before use.
- A failed synchronization never removes the last usable version of a document.
- Vectors from different models or dimensions are never mixed in one index.
- The initial synchronous synchronization is intentionally limited to a small personal library.

## Deferred concerns

Authentication, tenant isolation, durable background jobs, persisted conversations, formal RAG evaluation, and production deployment are outside the current learning scope.
