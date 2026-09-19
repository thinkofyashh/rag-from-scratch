import { useEffect, useRef } from "react";

import { Icon } from "./Icon";
import styles from "./workspace.module.css";
import type { ChatMessage, RetrievalStrategy } from "@/types/api";

const suggestions = [
  "Explain HNSW like I am seeing it for the first time",
  "How should I choose chunk size and overlap?",
  "Compare dense and sparse retrieval",
];

type ConversationPanelProps = {
  messages: ChatMessage[];
  question: string;
  strategy: RetrievalStrategy;
  topK: number;
  selectedSourceCount: number;
  isStreaming: boolean;
  onQuestionChange: (value: string) => void;
  onStrategyChange: (strategy: RetrievalStrategy) => void;
  onTopKChange: (topK: number) => void;
  onSubmit: (question?: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onCopy: (content: string) => void;
  onCitationSelect: (citationId: string) => void;
  onOpenSources: () => void;
  onOpenEvidence: () => void;
};

export function ConversationPanel({
  messages,
  question,
  strategy,
  topK,
  selectedSourceCount,
  isStreaming,
  onQuestionChange,
  onStrategyChange,
  onTopKChange,
  onSubmit,
  onStop,
  onRetry,
  onCopy,
  onCitationSelect,
  onOpenSources,
  onOpenEvidence,
}: ConversationPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [isStreaming, messages]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className={styles.conversationPanel} aria-label="AskLearnly conversation">
      <header className={styles.chatHeader}>
        <button className={styles.mobilePanelButton} type="button" onClick={onOpenSources}>
          <Icon name="panelLeft" />
          Sources
        </button>
        <div className={styles.chatTitle}>
          <span className={styles.onlineDot} />
          <div>
            <strong>AskLearnly</strong>
            <small>{selectedSourceCount || "All"} sources in scope</small>
          </div>
        </div>
        <button className={styles.mobilePanelButton} type="button" onClick={onOpenEvidence}>
          Evidence
          <Icon name="quote" />
        </button>
      </header>

      <div className={styles.messages} aria-live="polite">
        {!messages.length ? (
          <div className={styles.welcome}>
            <div className={styles.orbitMark} aria-hidden>
              <span />
              <Icon name="sparkles" />
            </div>
            <span className={styles.eyebrow}>A clearer way through your notes</span>
            <h1>
              Ask your library.
              <br />
              <em>See the evidence.</em>
            </h1>
            <p>
              AskLearnly searches the notes you choose, then keeps every supporting passage close
              enough to inspect.
            </p>
            <div className={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <button key={suggestion} type="button" onClick={() => onSubmit(suggestion)}>
                  <span>0{index + 1}</span>
                  {suggestion}
                  <Icon name="arrowUp" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageStack}>
            {messages.map((message) =>
              message.role === "user" ? (
                <article key={message.id} className={styles.userMessage}>
                  <span>You</span>
                  <p>{message.content}</p>
                </article>
              ) : (
                <article key={message.id} className={styles.assistantMessage}>
                  <div className={styles.assistantAvatar} aria-hidden>
                    <Icon name="sparkles" />
                  </div>
                  <div className={styles.assistantBody}>
                    <span className={styles.messageAuthor}>AskLearnly</span>
                    <p className={message.state === "error" ? styles.errorText : ""}>
                      {message.content || "Looking through your notes…"}
                      {message.state === "streaming" ? <span className={styles.cursor} /> : null}
                    </p>
                    {message.citations.length ? (
                      <div className={styles.citationChips} aria-label="Answer citations">
                        {message.citations.map((citation, index) => (
                          <button
                            key={citation.id}
                            type="button"
                            onClick={() => onCitationSelect(citation.id)}
                          >
                            <span>{index + 1}</span>
                            {citation.title} · p.{citation.pageNumber}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {message.state === "complete" && message.content ? (
                      <div className={styles.messageActions}>
                        <button type="button" onClick={() => onCopy(message.content)}>
                          <Icon name="clipboard" /> Copy
                        </button>
                      </div>
                    ) : null}
                    {message.state === "error" ? (
                      <button className={styles.retryButton} type="button" onClick={onRetry}>
                        <Icon name="refresh" /> Try again
                      </button>
                    ) : null}
                  </div>
                </article>
              ),
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={styles.composerWrap}>
        <form className={styles.composer} onSubmit={submit}>
          <label className={styles.srOnly} htmlFor="asklearnly-question">
            Ask a question about your notes
          </label>
          <textarea
            id="asklearnly-question"
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            rows={1}
            placeholder="Ask anything from your notes…"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              className={styles.sendButton}
              type="button"
              onClick={onStop}
              aria-label="Stop answer"
            >
              <Icon name="stop" />
            </button>
          ) : (
            <button
              className={styles.sendButton}
              type="submit"
              disabled={!question.trim()}
              aria-label="Send question"
            >
              <Icon name="arrowUp" />
            </button>
          )}
          <div className={styles.composerMeta}>
            <details className={styles.settingsMenu}>
              <summary>
                <Icon name="settings" /> Retrieval settings <Icon name="chevron" />
              </summary>
              <div className={styles.settingsCard}>
                <label>
                  Strategy
                  <select
                    value={strategy}
                    onChange={(event) => onStrategyChange(event.target.value as RetrievalStrategy)}
                  >
                    <option value="similarity">Focused · Similarity</option>
                    <option value="mmr">Diverse · MMR</option>
                    <option value="hybrid">Balanced · Hybrid</option>
                    <option value="ensemble">Advanced · Ensemble</option>
                  </select>
                </label>
                <label>
                  Evidence count <span>{topK}</span>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={topK}
                    onChange={(event) => onTopKChange(Number(event.target.value))}
                  />
                </label>
              </div>
            </details>
            <span>Enter to send · Shift + Enter for a new line</span>
          </div>
        </form>
      </div>
    </section>
  );
}
