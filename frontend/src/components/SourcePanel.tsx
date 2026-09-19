import { useId, useMemo, useState } from "react";

import { Icon } from "./Icon";
import styles from "./workspace.module.css";
import type { SourceDocument, SyncSummary } from "@/types/api";

const statusLabel: Record<SourceDocument["indexStatus"], string> = {
  not_indexed: "Not indexed",
  indexing: "Indexing",
  indexed: "Ready",
  stale: "Update ready",
  failed: "Needs attention",
};

type SourcePanelProps = {
  sources: SourceDocument[];
  selectedIds: number[];
  isSyncing: boolean;
  syncSummary: SyncSummary | null;
  embeddingModel: string;
  vectorBackend: string;
  onToggle: (sourceId: number) => void;
  onSelectAll: () => void;
  onSync: () => void;
  onClose?: () => void;
};

export function SourcePanel({
  sources,
  selectedIds,
  isSyncing,
  syncSummary,
  embeddingModel,
  vectorBackend,
  onToggle,
  onSelectAll,
  onSync,
  onClose,
}: SourcePanelProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredSources = sources.filter((source) =>
    `${source.title} ${source.topics.join(" ")}`.toLowerCase().includes(query.toLowerCase()),
  );
  const availableCount = sources.filter((source) => source.indexStatus !== "failed").length;

  return (
    <aside className={styles.sourcePanel} aria-label="Knowledge sources">
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.eyebrow}>Knowledge scope</span>
          <h2>Your library</h2>
        </div>
        {onClose ? (
          <button
            className={styles.iconButton}
            type="button"
            onClick={onClose}
            aria-label="Close sources"
          >
            <Icon name="close" />
          </button>
        ) : null}
      </div>

      <div className={styles.searchField}>
        <Icon name="search" />
        <label className={styles.srOnly} htmlFor={searchId}>
          Search sources
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a note"
        />
      </div>

      <div className={styles.scopeRow}>
        <button type="button" onClick={onSelectAll} className={styles.scopeButton}>
          <span className={styles.scopeIcon}>
            <Icon name="books" />
          </span>
          <span>
            <strong>All indexed notes</strong>
            <small>{availableCount} sources available</small>
          </span>
          <span className={styles.selectionCount}>{selectedIds.length}</span>
        </button>
      </div>

      <div className={styles.sourceList}>
        {filteredSources.map((source) => {
          const isDisabled =
            source.indexStatus === "failed" || source.indexStatus === "not_indexed";
          const isSelected = selected.has(source.id);
          return (
            <label
              key={source.id}
              className={`${styles.sourceItem} ${isSelected ? styles.sourceSelected : ""} ${isDisabled ? styles.sourceDisabled : ""}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onToggle(source.id)}
              />
              <span className={styles.customCheckbox} aria-hidden>
                {isSelected ? <Icon name="check" /> : null}
              </span>
              <span className={styles.sourceCopy}>
                <strong>{source.title}</strong>
                <span className={styles.sourceMeta}>
                  {source.pageCount} pages · {source.chunkCount} chunks
                </span>
                <span className={`${styles.status} ${styles[`status_${source.indexStatus}`]}`}>
                  <span />
                  {statusLabel[source.indexStatus]}
                </span>
              </span>
            </label>
          );
        })}
        {!filteredSources.length ? (
          <p className={styles.emptyList}>No notes match “{query}”.</p>
        ) : null}
      </div>

      <div className={styles.sourceFooter}>
        {syncSummary ? (
          <p className={styles.syncSummary} role="status">
            <Icon name={syncSummary.failed ? "warning" : "check"} />
            {syncSummary.updated + syncSummary.indexed} updated · {syncSummary.skipped} unchanged
          </p>
        ) : null}
        <button className={styles.syncButton} type="button" onClick={onSync} disabled={isSyncing}>
          <Icon name="refresh" className={isSyncing ? styles.spinning : ""} />
          {isSyncing ? "Synchronizing…" : "Sync Learnly"}
        </button>
        <div className={styles.engineMeta}>
          <span>{embeddingModel}</span>
          <span>{vectorBackend}</span>
        </div>
      </div>
    </aside>
  );
}
