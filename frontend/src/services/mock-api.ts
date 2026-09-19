import type {
  ChatRequest,
  ChatStreamEvent,
  Citation,
  SourceDocument,
  SourceListResponse,
  SyncSummary,
} from "@/types/api";

const delay = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("The request was cancelled.", "AbortError"));
      },
      { once: true },
    );
  });

let mockSources: SourceDocument[] = [
  {
    id: 18,
    slug: "attention-mechanisms",
    title: "Attention mechanisms",
    topics: ["Deep learning", "Transformers"],
    pageCount: 14,
    chunkCount: 42,
    previewUrl: "http://localhost:8001/api/v1/documents/18/preview",
    indexStatus: "indexed",
    indexError: null,
    checksum: "sha256:attention",
    updatedAt: "2026-09-18T13:12:00Z",
    indexedAt: "2026-09-18T13:13:00Z",
  },
  {
    id: 22,
    slug: "vector-databases",
    title: "Vector databases & indexing",
    topics: ["RAG", "Databases"],
    pageCount: 19,
    chunkCount: 58,
    previewUrl: "http://localhost:8001/api/v1/documents/22/preview",
    indexStatus: "indexed",
    indexError: null,
    checksum: "sha256:vectors",
    updatedAt: "2026-09-17T09:08:00Z",
    indexedAt: "2026-09-17T09:09:00Z",
  },
  {
    id: 27,
    slug: "retrieval-patterns",
    title: "Retrieval patterns",
    topics: ["RAG", "Search"],
    pageCount: 11,
    chunkCount: 31,
    previewUrl: "http://localhost:8001/api/v1/documents/27/preview",
    indexStatus: "indexed",
    indexError: null,
    checksum: "sha256:retrieval",
    updatedAt: "2026-09-16T15:42:00Z",
    indexedAt: "2026-09-16T15:43:00Z",
  },
  {
    id: 31,
    slug: "chunking-strategies",
    title: "Chunking strategies",
    topics: ["RAG", "Documents"],
    pageCount: 9,
    chunkCount: 24,
    previewUrl: "http://localhost:8001/api/v1/documents/31/preview",
    indexStatus: "stale",
    indexError: null,
    checksum: "sha256:chunks",
    updatedAt: "2026-09-19T06:25:00Z",
    indexedAt: "2026-09-15T07:11:00Z",
  },
  {
    id: 36,
    slug: "neural-network-basics",
    title: "Neural network basics",
    topics: ["Deep learning"],
    pageCount: 17,
    chunkCount: 49,
    previewUrl: "http://localhost:8001/api/v1/documents/36/preview",
    indexStatus: "indexed",
    indexError: null,
    checksum: "sha256:neural",
    updatedAt: "2026-09-13T10:20:00Z",
    indexedAt: "2026-09-13T10:21:00Z",
  },
  {
    id: 41,
    slug: "handwritten-revision-set",
    title: "Handwritten revision set",
    topics: ["Revision"],
    pageCount: 8,
    chunkCount: 0,
    previewUrl: "http://localhost:8001/api/v1/documents/41/preview",
    indexStatus: "failed",
    indexError: "No searchable text was found in this PDF.",
    checksum: "sha256:revision",
    updatedAt: "2026-09-19T04:13:00Z",
    indexedAt: null,
  },
];

const citationsBySource: Record<number, Citation> = {
  18: {
    id: "chunk-18-4",
    sourceId: 18,
    title: "Attention mechanisms",
    pageNumber: 6,
    excerpt:
      "Scaled dot-product attention divides each query-key dot product by the square root of the key dimension before applying softmax.",
    score: 0.91,
    previewUrl: "http://localhost:8001/api/v1/documents/18/preview#page=6",
  },
  22: {
    id: "chunk-22-11",
    sourceId: 22,
    title: "Vector databases & indexing",
    pageNumber: 8,
    excerpt:
      "HNSW builds a layered proximity graph, trading additional memory and construction time for strong search performance.",
    score: 0.87,
    previewUrl: "http://localhost:8001/api/v1/documents/22/preview#page=8",
  },
  27: {
    id: "chunk-27-5",
    sourceId: 27,
    title: "Retrieval patterns",
    pageNumber: 4,
    excerpt:
      "Hybrid retrieval combines dense semantic similarity with sparse lexical matching and fuses the independent rankings.",
    score: 0.84,
    previewUrl: "http://localhost:8001/api/v1/documents/27/preview#page=4",
  },
  31: {
    id: "chunk-31-2",
    sourceId: 31,
    title: "Chunking strategies",
    pageNumber: 3,
    excerpt:
      "Overlap preserves context across boundaries, but excessive overlap increases storage and can return repetitive evidence.",
    score: 0.8,
    previewUrl: "http://localhost:8001/api/v1/documents/31/preview#page=3",
  },
  36: {
    id: "chunk-36-9",
    sourceId: 36,
    title: "Neural network basics",
    pageNumber: 10,
    excerpt:
      "Normalization and careful initialization help stabilize gradients as signals move through deeper networks.",
    score: 0.76,
    previewUrl: "http://localhost:8001/api/v1/documents/36/preview#page=10",
  },
};

function cloneSources(): SourceDocument[] {
  return mockSources.map((source) => ({ ...source, topics: [...source.topics] }));
}

export async function getMockSources(): Promise<SourceListResponse> {
  return {
    items: cloneSources(),
    embeddingModel: "text-embedding-3-small",
    embeddingDimensions: 1536,
    vectorBackend: "memory",
  };
}

export async function syncMockSources(): Promise<SyncSummary> {
  await delay(900);
  const now = new Date().toISOString();
  mockSources = mockSources.map((source) =>
    source.indexStatus === "stale"
      ? { ...source, indexStatus: "indexed", indexedAt: now, chunkCount: 27 }
      : source,
  );

  return {
    indexed: 0,
    updated: 1,
    skipped: 4,
    removed: 0,
    failed: 1,
    failures: [{ sourceId: 41, message: "No searchable text was found in this PDF." }],
    completedAt: now,
  };
}

function selectCitations(request: ChatRequest): Citation[] {
  const availableIds = request.sourceIds.length
    ? request.sourceIds
    : mockSources.filter((source) => source.indexStatus === "indexed").map((source) => source.id);

  const question = request.question.toLowerCase();
  const preferredSourceId =
    question.includes("hnsw") || question.includes("index")
      ? 22
      : question.includes("chunk") || question.includes("overlap")
        ? 31
        : question.includes("attention") || question.includes("scal")
          ? 18
          : null;
  const rankedIds = preferredSourceId
    ? [preferredSourceId, ...availableIds.filter((sourceId) => sourceId !== preferredSourceId)]
    : availableIds;

  return rankedIds
    .filter((sourceId) => availableIds.includes(sourceId))
    .map((sourceId) => citationsBySource[sourceId])
    .filter((citation): citation is Citation => Boolean(citation))
    .slice(0, Math.min(request.topK, 3));
}

function createMockAnswer(question: string, citations: Citation[]): string {
  const lowerQuestion = question.toLowerCase();
  const reference = citations[0];

  if (!reference) {
    return "I could not find enough indexed evidence in the selected notes. Try selecting another source or synchronizing the library.";
  }

  if (lowerQuestion.includes("hnsw") || lowerQuestion.includes("index")) {
    return "HNSW organizes vectors as a layered proximity graph. A query starts in sparse upper layers to move quickly toward a promising region, then searches more carefully in denser lower layers. This usually gives a strong speed–recall trade-off, while requiring more memory and slower index construction than simpler approaches.";
  }

  if (lowerQuestion.includes("chunk") || lowerQuestion.includes("overlap")) {
    return "Chunk overlap protects meaning that crosses a boundary, but it should stay modest. Too little overlap can separate a claim from its explanation; too much creates repetitive results and unnecessary embeddings. Begin with a clear baseline, inspect the resulting passages, and adjust it for the structure of your notes.";
  }

  if (lowerQuestion.includes("attention") || lowerQuestion.includes("scal")) {
    return "Scaled dot-product attention divides query–key scores by the square root of the key dimension before softmax. Without that scaling, larger dimensions can produce extreme scores, pushing softmax toward very small gradients. Scaling keeps the distribution better behaved during training.";
  }

  return `The strongest evidence appears in “${reference.title}.” It connects the question to the retrieved passage on page ${reference.pageNumber}. The key idea is to use the source as the factual boundary, combine it with the related passages, and avoid adding claims that the selected notes do not support.`;
}

export async function* streamMockChat(
  request: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const citations = selectCitations(request);
  await delay(360, signal);
  yield { type: "retrieval", citations };

  const answer = createMockAnswer(request.question, citations);
  const tokens = answer.match(/\S+\s*/g) ?? [answer];

  for (const token of tokens) {
    await delay(28, signal);
    yield { type: "token", delta: token };
  }

  yield { type: "done", finishReason: "stop", model: "mock-grounded-model" };
}
