import { getMockSources, streamMockChat, syncMockSources } from "./mock-api";
import type { ChatRequest, ChatStreamEvent, SourceListResponse, SyncSummary } from "@/types/api";

const baseUrl =
  process.env.NEXT_PUBLIC_RAG_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000/api/v1";
const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail =
      body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

export function getSources(): Promise<SourceListResponse> {
  return useMockApi ? getMockSources() : requestJson<SourceListResponse>("/sources");
}

export function syncSources(): Promise<SyncSummary> {
  return useMockApi
    ? syncMockSources()
    : requestJson<SyncSummary>("/sources/sync", { method: "POST" });
}

function parseEvent(eventName: string, rawData: string): ChatStreamEvent | null {
  const data: unknown = JSON.parse(rawData);
  if (!data || typeof data !== "object") return null;

  if (eventName === "retrieval" && "citations" in data && Array.isArray(data.citations)) {
    return { type: "retrieval", citations: data.citations } as ChatStreamEvent;
  }
  if (eventName === "token" && "delta" in data && typeof data.delta === "string") {
    return { type: "token", delta: data.delta };
  }
  if (
    eventName === "done" &&
    "finishReason" in data &&
    typeof data.finishReason === "string" &&
    "model" in data &&
    typeof data.model === "string"
  ) {
    return { type: "done", finishReason: data.finishReason, model: data.model };
  }
  if (
    eventName === "error" &&
    "code" in data &&
    typeof data.code === "string" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return { type: "error", code: data.code, message: data.message };
  }

  return null;
}

export async function* parseServerSentEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        }
        if (!dataLines.length) continue;
        const event = parseEvent(eventName, dataLines.join("\n"));
        if (event) yield event;
      }

      if (done) break;
    }

    if (buffer.trim()) {
      let eventName = "message";
      const dataLines: string[] = [];
      for (const line of buffer.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length) {
        const event = parseEvent(eventName, dataLines.join("\n"));
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamChat(
  request: ChatRequest,
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  if (useMockApi) {
    yield* streamMockChat(request, signal);
    return;
  }

  const response = await fetch(`${baseUrl}/chat/stream`, {
    method: "POST",
    headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new ApiError(`The answer stream failed with status ${response.status}`, response.status);
  }

  yield* parseServerSentEvents(response.body);
}

export const apiMode = useMockApi ? "mock" : "live";
