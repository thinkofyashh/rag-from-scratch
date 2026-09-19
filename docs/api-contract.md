# AskLearnly API contract

The backend base URL defaults to `http://localhost:8000/api/v1`. JSON fields use `camelCase`; Python implementations may use `snake_case` internally.

## Health

### `GET /health`

Returns `200` when the service process is available.

```json
{ "status": "ok" }
```

## Sources

### `GET /sources`

Returns all known Learnly sources.

```json
{
  "items": [
    {
      "id": 18,
      "slug": "attention-mechanisms",
      "title": "Attention mechanisms",
      "topics": ["Deep learning"],
      "pageCount": 14,
      "chunkCount": 42,
      "previewUrl": "http://localhost:8000/api/v1/documents/18/preview",
      "indexStatus": "indexed",
      "indexError": null,
      "checksum": "sha256:...",
      "updatedAt": "2026-09-19T08:30:00Z",
      "indexedAt": "2026-09-19T08:31:00Z"
    }
  ],
  "embeddingModel": "text-embedding-3-small",
  "embeddingDimensions": 1536,
  "vectorBackend": "memory"
}
```

`indexStatus` is one of `not_indexed`, `indexing`, `indexed`, `stale`, or `failed`.

### `POST /sources/sync`

Synchronizes the currently published Learnly collection. The request has no body.

```json
{
  "indexed": 2,
  "updated": 1,
  "skipped": 12,
  "removed": 0,
  "failed": 1,
  "failures": [
    { "sourceId": 21, "message": "No searchable text was found in this PDF." }
  ],
  "completedAt": "2026-09-19T08:31:00Z"
}
```

## Streaming chat

### `POST /chat/stream`

Request body:

```json
{
  "question": "Why does self-attention use scaling?",
  "sourceIds": [18, 22],
  "strategy": "hybrid",
  "topK": 5,
  "scoreThreshold": 0.25,
  "history": [
    { "role": "user", "content": "What is self-attention?" },
    { "role": "assistant", "content": "Self-attention relates tokens within a sequence." }
  ]
}
```

`strategy` is one of `similarity`, `mmr`, `hybrid`, or `ensemble`. An empty `sourceIds` array means all indexed sources.

Successful responses use `Content-Type: text/event-stream`. Every event contains one JSON object in its `data` field.

```text
event: retrieval
data: {"citations":[{"id":"chunk-18-4","sourceId":18,"title":"Attention mechanisms","pageNumber":6,"excerpt":"Scaled dot-product attention divides...","score":0.86,"previewUrl":"http://localhost:8000/api/v1/documents/18/preview#page=6"}]}

event: token
data: {"delta":"The scaling factor "}

event: token
data: {"delta":"keeps dot products from growing too large."}

event: done
data: {"finishReason":"stop","model":"configured-model"}
```

On a recoverable stream failure:

```text
event: error
data: {"code":"generation_failed","message":"The answer could not be completed."}
```

## Errors

Non-streaming errors use:

```json
{
  "detail": "Human-readable explanation",
  "code": "stable_machine_code"
}
```

Validation errors may use FastAPI's structured `detail` array. The frontend converts all server errors into concise user-facing messages.
