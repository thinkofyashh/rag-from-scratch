"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { ConversationPanel } from "./ConversationPanel";
import { EvidencePanel } from "./EvidencePanel";
import { Icon } from "./Icon";
import { SourcePanel } from "./SourcePanel";
import styles from "./workspace.module.css";
import { apiMode, getSources, streamChat, syncSources } from "@/services/api-client";
import type {
  ChatMessage,
  Citation,
  RetrievalStrategy,
  SourceListResponse,
  SyncSummary,
} from "@/types/api";

type MobilePanel = "sources" | "evidence" | null;

type AskWorkspaceProps = {
  initialSources: SourceListResponse;
  initialDocumentId: number | null;
  connectionError: string | null;
};

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isUsableSource(status: SourceListResponse["items"][number]["indexStatus"]): boolean {
  return status === "indexed" || status === "stale";
}

export function AskWorkspace({
  initialSources,
  initialDocumentId,
  connectionError,
}: AskWorkspaceProps) {
  const initialSelectableIds = initialSources.items
    .filter((source) => isUsableSource(source.indexStatus))
    .map((source) => source.id);
  const initialSelection =
    initialDocumentId && initialSelectableIds.includes(initialDocumentId)
      ? [initialDocumentId]
      : initialSelectableIds;

  const [sourceData, setSourceData] = useState(initialSources);
  const [selectedIds, setSelectedIds] = useState(initialSelection);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [strategy, setStrategy] = useState<RetrievalStrategy>("hybrid");
  const [topK, setTopK] = useState(5);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [isDark, setIsDark] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const mobileTriggerRef = useRef<HTMLElement | null>(null);

  const learnlyUrl = process.env.NEXT_PUBLIC_LEARNLY_URL ?? "http://localhost:3001";
  const selectedSourceCount = selectedIds.length;
  const usableIds = useMemo(
    () =>
      sourceData.items
        .filter((source) => isUsableSource(source.indexStatus))
        .map((source) => source.id),
    [sourceData.items],
  );

  useEffect(() => {
    if (!mobilePanel) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobilePanel(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      mobileTriggerRef.current?.focus();
    };
  }, [mobilePanel]);

  function openMobilePanel(panel: Exclude<MobilePanel, null>) {
    mobileTriggerRef.current = document.activeElement as HTMLElement | null;
    setMobilePanel(panel);
  }

  function closeMobilePanel() {
    setMobilePanel(null);
  }

  function trapDrawerFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === drawerRef.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function toggleSource(sourceId: number) {
    startTransition(() => {
      setSelectedIds((current) => {
        if (current.includes(sourceId)) {
          return current.length === 1 ? current : current.filter((id) => id !== sourceId);
        }
        return [...current, sourceId];
      });
    });
  }

  function selectAllSources() {
    startTransition(() => setSelectedIds(usableIds));
  }

  async function synchronize() {
    setIsSyncing(true);
    setSyncSummary(null);
    try {
      const summary = await syncSources();
      const refreshed = await getSources();
      setSyncSummary(summary);
      setSourceData(refreshed);
      setSelectedIds((current) => {
        const nextUsable = refreshed.items
          .filter((source) => isUsableSource(source.indexStatus))
          .map((source) => source.id);
        const stillAvailable = current.filter((id) => nextUsable.includes(id));
        return stillAvailable.length ? stillAvailable : nextUsable;
      });
    } catch {
      setSyncSummary({
        indexed: 0,
        updated: 0,
        skipped: 0,
        removed: 0,
        failed: 1,
        failures: [{ sourceId: 0, message: "AskLearnly could not reach the sync service." }],
        completedAt: new Date().toISOString(),
      });
    } finally {
      setIsSyncing(false);
    }
  }

  async function ask(explicitQuestion?: string) {
    const nextQuestion = (explicitQuestion ?? question).trim();
    if (!nextQuestion || isStreaming) return;

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: nextQuestion,
      state: "complete",
      citations: [],
    };
    const assistantId = createMessageId("assistant");
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      state: "streaming",
      citations: [],
    };
    const history = messages
      .filter((message) => message.state === "complete")
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    setQuestion("");
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setCitations([]);
    setActiveCitationId(null);
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for await (const event of streamChat(
        {
          question: nextQuestion,
          sourceIds: selectedIds,
          strategy,
          topK,
          scoreThreshold: 0.25,
          history,
        },
        controller.signal,
      )) {
        if (event.type === "retrieval") {
          setCitations(event.citations);
          setActiveCitationId(event.citations[0]?.id ?? null);
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, citations: event.citations } : message,
            ),
          );
        }
        if (event.type === "token") {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + event.delta }
                : message,
            ),
          );
        }
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "done") {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, state: "complete" } : message,
            ),
          );
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: message.content || "Response stopped.",
                  state: "complete",
                }
              : message,
          ),
        );
      } else {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content:
                    error instanceof Error
                      ? error.message
                      : "AskLearnly could not complete this answer.",
                  state: "error",
                }
              : message,
          ),
        );
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  }

  function stopAnswer() {
    abortRef.current?.abort();
  }

  function retryLastQuestion() {
    const lastQuestion = [...messages].reverse().find((message) => message.role === "user");
    if (!lastQuestion) return;
    setMessages((current) => {
      const lastErrorIndex = current.findLastIndex(
        (message) => message.role === "assistant" && message.state === "error",
      );
      return lastErrorIndex >= 0 ? current.filter((_, index) => index !== lastErrorIndex) : current;
    });
    void ask(lastQuestion.content);
  }

  function selectCitation(citationId: string) {
    setActiveCitationId(citationId);
    if (window.matchMedia("(max-width: 930px)").matches) openMobilePanel("evidence");
  }

  function toggleTheme() {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
  }

  return (
    <main className={styles.appShell}>
      <header className={styles.appHeader}>
        <Link href="/ask" className={styles.brand} aria-label="AskLearnly home">
          <span className={styles.brandMark}>A</span>
          <span>
            AskLearnly<em>.</em>
          </span>
        </Link>
        <div className={styles.headerCenter}>
          <span className={styles.headerLine} />
          <span>Connected learning workspace</span>
          <span className={styles.headerLine} />
        </div>
        <nav className={styles.headerActions} aria-label="Application links">
          {apiMode === "mock" ? <span className={styles.previewBadge}>Preview data</span> : null}
          <a href={learnlyUrl} target="_blank" rel="noreferrer" className={styles.learnlyLink}>
            Learnly library <Icon name="external" />
          </a>
          <button className={styles.themeButton} type="button" onClick={toggleTheme}>
            <Icon name={isDark ? "sun" : "moon"} />
            <span className={styles.srOnly}>Use {isDark ? "light" : "dark"} theme</span>
          </button>
        </nav>
      </header>

      {connectionError ? (
        <div className={styles.connectionBanner} role="status">
          <Icon name="warning" />
          {connectionError} Reconnect the service to load your sources.
        </div>
      ) : null}

      <div className={styles.workspaceGrid}>
        <div className={styles.desktopSources}>
          <SourcePanel
            sources={sourceData.items}
            selectedIds={selectedIds}
            isSyncing={isSyncing}
            syncSummary={syncSummary}
            embeddingModel={sourceData.embeddingModel}
            vectorBackend={sourceData.vectorBackend}
            onToggle={toggleSource}
            onSelectAll={selectAllSources}
            onSync={() => void synchronize()}
          />
        </div>

        <ConversationPanel
          messages={messages}
          question={question}
          strategy={strategy}
          topK={topK}
          selectedSourceCount={selectedSourceCount}
          isStreaming={isStreaming}
          onQuestionChange={setQuestion}
          onStrategyChange={setStrategy}
          onTopKChange={setTopK}
          onSubmit={(value) => void ask(value)}
          onStop={stopAnswer}
          onRetry={retryLastQuestion}
          onCopy={(content) => void navigator.clipboard.writeText(content)}
          onCitationSelect={selectCitation}
          onOpenSources={() => openMobilePanel("sources")}
          onOpenEvidence={() => openMobilePanel("evidence")}
        />

        <div className={styles.desktopEvidence}>
          <EvidencePanel
            citations={citations}
            activeCitationId={activeCitationId}
            onSelect={setActiveCitationId}
          />
        </div>
      </div>

      {mobilePanel ? (
        <div className={styles.mobileOverlay} role="presentation" onMouseDown={closeMobilePanel}>
          <div
            ref={drawerRef}
            className={styles.mobileDrawer}
            role="dialog"
            aria-modal="true"
            aria-label={mobilePanel === "sources" ? "Knowledge sources" : "Retrieved evidence"}
            tabIndex={-1}
            onKeyDown={trapDrawerFocus}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {mobilePanel === "sources" ? (
              <SourcePanel
                sources={sourceData.items}
                selectedIds={selectedIds}
                isSyncing={isSyncing}
                syncSummary={syncSummary}
                embeddingModel={sourceData.embeddingModel}
                vectorBackend={sourceData.vectorBackend}
                onToggle={toggleSource}
                onSelectAll={selectAllSources}
                onSync={() => void synchronize()}
                onClose={closeMobilePanel}
              />
            ) : (
              <EvidencePanel
                citations={citations}
                activeCitationId={activeCitationId}
                onSelect={setActiveCitationId}
                onClose={closeMobilePanel}
              />
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
