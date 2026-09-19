import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConversationPanel } from "./ConversationPanel";

function renderPanel(overrides: Partial<React.ComponentProps<typeof ConversationPanel>> = {}) {
  const props: React.ComponentProps<typeof ConversationPanel> = {
    messages: [],
    question: "",
    strategy: "hybrid",
    topK: 5,
    selectedSourceCount: 3,
    isStreaming: false,
    onQuestionChange: vi.fn(),
    onStrategyChange: vi.fn(),
    onTopKChange: vi.fn(),
    onSubmit: vi.fn(),
    onStop: vi.fn(),
    onRetry: vi.fn(),
    onCopy: vi.fn(),
    onCitationSelect: vi.fn(),
    onOpenSources: vi.fn(),
    onOpenEvidence: vi.fn(),
    ...overrides,
  };
  render(<ConversationPanel {...props} />);
  return props;
}

describe("ConversationPanel", () => {
  it("starts a suggested question", async () => {
    const user = userEvent.setup();
    const props = renderPanel();

    await user.click(
      screen.getByRole("button", {
        name: /Explain HNSW like I am seeing it for the first time/,
      }),
    );

    expect(props.onSubmit).toHaveBeenCalledWith(
      "Explain HNSW like I am seeing it for the first time",
    );
  });

  it("opens a citation from a completed answer", async () => {
    const user = userEvent.setup();
    const props = renderPanel({
      messages: [
        {
          id: "answer-1",
          role: "assistant",
          content: "HNSW uses a layered graph.",
          state: "complete",
          citations: [
            {
              id: "chunk-1",
              sourceId: 1,
              title: "Vector indexing",
              pageNumber: 7,
              excerpt: "A layered graph narrows the search region.",
              score: 0.91,
              previewUrl: "https://learnly.test/1#page=7",
            },
          ],
        },
      ],
    });

    await user.click(screen.getByRole("button", { name: /Vector indexing · p\.7/ }));

    expect(props.onCitationSelect).toHaveBeenCalledWith("chunk-1");
  });
});
