export type IndexStatus = "not_indexed" | "indexing" | "indexed" | "stale" | "failed";
export type RetrievalStrategy = "similarity" | "mmr" | "hybrid" | "ensemble";
export type MessageRole = "user" | "assistant";
export type MessageState = "complete" | "streaming" | "error";

export interface SourceDocument {
  id: number;
  slug: string;
  title: string;
  topics: string[];
  pageCount: number;
  chunkCount: number;
  previewUrl: string;
  indexStatus: IndexStatus;
  indexError: string | null;
  checksum: string;
  updatedAt: string;
  indexedAt: string | null;
}

export interface SourceListResponse {
  items: SourceDocument[];
  embeddingModel: string;
  embeddingDimensions: number;
  vectorBackend: "memory" | "pgvector";
}

export interface SyncFailure {
  sourceId: number;
  message: string;
}

export interface SyncSummary {
  indexed: number;
  updated: number;
  skipped: number;
  removed: number;
  failed: number;
  failures: SyncFailure[];
  completedAt: string;
}

export interface Citation {
  id: string;
  sourceId: number;
  title: string;
  pageNumber: number;
  excerpt: string;
  score: number;
  previewUrl: string;
}

export interface ChatHistoryItem {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  question: string;
  sourceIds: number[];
  strategy: RetrievalStrategy;
  topK: number;
  scoreThreshold: number;
  history: ChatHistoryItem[];
}

export interface ChatMessage extends ChatHistoryItem {
  id: string;
  state: MessageState;
  citations: Citation[];
}

export type ChatStreamEvent =
  | { type: "retrieval"; citations: Citation[] }
  | { type: "token"; delta: string }
  | { type: "done"; finishReason: string; model: string }
  | { type: "error"; code: string; message: string };
