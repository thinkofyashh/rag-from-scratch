import { AskWorkspace } from "@/components/AskWorkspace";
import { getSources } from "@/services/api-client";
import type { SourceListResponse } from "@/types/api";

type AskPageProps = {
  searchParams: Promise<{ documentId?: string }>;
};

const emptySources: SourceListResponse = {
  items: [],
  embeddingModel: "Not connected",
  embeddingDimensions: 0,
  vectorBackend: "memory",
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const { documentId } = await searchParams;
  const parsedDocumentId = documentId ? Number.parseInt(documentId, 10) : null;
  let connectionError: string | null = null;
  let initialSources = emptySources;

  try {
    initialSources = await getSources();
  } catch {
    connectionError = "The AskLearnly service is not available.";
  }

  return (
    <AskWorkspace
      initialSources={initialSources}
      initialDocumentId={Number.isFinite(parsedDocumentId) ? parsedDocumentId : null}
      connectionError={connectionError}
    />
  );
}
