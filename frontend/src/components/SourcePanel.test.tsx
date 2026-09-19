import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SourcePanel } from "./SourcePanel";
import type { SourceDocument } from "@/types/api";

const sources: SourceDocument[] = [
  {
    id: 1,
    slug: "vector-search",
    title: "Vector search",
    topics: ["Retrieval"],
    pageCount: 12,
    chunkCount: 30,
    previewUrl: "https://learnly.test/1",
    indexStatus: "indexed",
    indexError: null,
    checksum: "one",
    updatedAt: "2026-09-19T00:00:00Z",
    indexedAt: "2026-09-19T00:00:00Z",
  },
  {
    id: 2,
    slug: "scanned-notes",
    title: "Scanned notes",
    topics: ["Revision"],
    pageCount: 4,
    chunkCount: 0,
    previewUrl: "https://learnly.test/2",
    indexStatus: "failed",
    indexError: "No searchable text",
    checksum: "two",
    updatedAt: "2026-09-19T00:00:00Z",
    indexedAt: null,
  },
];

function renderPanel(overrides: Partial<React.ComponentProps<typeof SourcePanel>> = {}) {
  const props: React.ComponentProps<typeof SourcePanel> = {
    sources,
    selectedIds: [1],
    isSyncing: false,
    syncSummary: null,
    embeddingModel: "text-embedding-3-small",
    vectorBackend: "memory",
    onToggle: vi.fn(),
    onSelectAll: vi.fn(),
    onSync: vi.fn(),
    ...overrides,
  };
  render(<SourcePanel {...props} />);
  return props;
}

describe("SourcePanel", () => {
  it("filters the library by title or topic", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByRole("searchbox", { name: "Search sources" }), "retrieval");

    expect(screen.getByText("Vector search")).toBeInTheDocument();
    expect(screen.queryByText("Scanned notes")).not.toBeInTheDocument();
  });

  it("keeps failed sources unavailable and exposes synchronization", async () => {
    const user = userEvent.setup();
    const props = renderPanel();

    expect(screen.getByRole("checkbox", { name: /Scanned notes/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Sync Learnly" }));

    expect(props.onSync).toHaveBeenCalledOnce();
  });
});
