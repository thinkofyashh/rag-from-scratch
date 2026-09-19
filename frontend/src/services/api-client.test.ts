import { describe, expect, it } from "vitest";

import { parseServerSentEvents } from "./api-client";

describe("parseServerSentEvents", () => {
  it("parses fragmented retrieval, token, and completion events", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      'event: retrieval\ndata: {"citations":[]}\n\nevent: token\nda',
      'ta: {"delta":"Hello "}\n\nevent: token\ndata: {"delta":"world"}\n\n',
      'event: done\ndata: {"finishReason":"stop","model":"test-model"}',
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });

    const events = [];
    for await (const event of parseServerSentEvents(stream)) events.push(event);

    expect(events).toEqual([
      { type: "retrieval", citations: [] },
      { type: "token", delta: "Hello " },
      { type: "token", delta: "world" },
      { type: "done", finishReason: "stop", model: "test-model" },
    ]);
  });
});
