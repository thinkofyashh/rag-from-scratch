# AskLearnly

AskLearnly is a retrieval-augmented learning companion for documents published in Learnly. It keeps document management in Learnly and adds a focused workspace for asking questions, inspecting retrieved evidence, and opening page-level sources.

## Architecture

```text
Learnly API -> synchronization -> loading -> chunking -> embeddings -> vector store
                                                               |
Question -> query embedding -> retrieval strategy -> context -> model -> cited answer
```

This repository is organized as two independently runnable applications:

- `frontend/` — Next.js web application
- `backend/` — FastAPI RAG service

The applications communicate through the versioned contract in [`docs/api-contract.md`](docs/api-contract.md). Learnly remains an independently deployable document-management application.

## Project status

The frontend is developed against a contract-compatible mock transport until the backend milestones are implemented. Set `NEXT_PUBLIC_USE_MOCK_API=false` to connect it to the FastAPI service.

See [`docs/architecture.md`](docs/architecture.md) for system boundaries and [`docs/rag-fundamentals.md`](docs/rag-fundamentals.md) for the learning model behind the project.
