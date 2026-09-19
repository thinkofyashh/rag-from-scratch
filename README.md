# RAG from Scratch

A hands-on implementation of a retrieval-augmented generation pipeline without retriever abstractions.

## Learning path

The project will cover:

- RAG fundamentals and architecture
- document loading, chunking, and metadata
- embeddings and vector representations
- vector-store operations and indexing strategies
- similarity search, score thresholds, and maximal marginal relevance
- dense and BM25 hybrid search
- ensemble retrieval
- answer generation from retrieved context

## Pipeline

```text
Documents -> Loader -> Chunker -> Embedding model -> Vector store
          -> Query embedding -> Similarity search -> Top-K chunks
          -> LLM -> Answer
```

Implementation will be added incrementally through focused milestones.
