# RAG fundamentals

Retrieval-augmented generation separates factual knowledge from answer generation. Instead of expecting a model to contain the current document collection, the application retrieves relevant passages and supplies them as bounded context for each answer.

## Indexing and querying are different pipelines

Indexing is performed when documents change:

```text
document -> load -> normalize -> chunk -> embed -> store
```

Querying happens for every question:

```text
question -> embed -> retrieve -> rank -> build context -> generate answer
```

The document and query embeddings must come from a compatible model and dimensionality. A generated answer cannot recover information that retrieval failed to place in its context.

## RAG, prompting, and fine-tuning

- Prompting supplies instructions and small amounts of context directly in one request. It is appropriate when all necessary information fits comfortably in that request.
- RAG looks up external, changing, or private knowledge at query time. It is appropriate for a document library whose contents and metadata change independently of the model.
- Fine-tuning changes model behaviour, format, or task specialization. It is not a practical replacement for frequently updated factual documents.

AskLearnly uses RAG because Learnly documents change over time, users need page-level evidence, and the answer should remain grounded in the selected source scope.

## Component responsibilities

- A loader turns a source into trustworthy document records.
- A chunker creates retrievable units while preserving lineage.
- An embedding provider converts documents and queries into compatible vectors.
- A vector store persists vectors and performs nearest-neighbour search.
- A retriever applies ranking, thresholds, diversity, filtering, and fusion.
- A context builder labels retrieved passages for traceable generation.
- A generator produces an answer from the supplied evidence.

Each component is kept behind a small interface so its behaviour can be understood and replaced without introducing a retriever framework.
