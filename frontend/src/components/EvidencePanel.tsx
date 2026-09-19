import { Icon } from "./Icon";
import styles from "./workspace.module.css";
import type { Citation } from "@/types/api";

type EvidencePanelProps = {
  citations: Citation[];
  activeCitationId: string | null;
  onSelect: (citationId: string) => void;
  onClose?: () => void;
};

function relevanceLabel(score: number): string {
  if (score >= 0.86) return "Strong match";
  if (score >= 0.72) return "Good match";
  return "Related";
}

export function EvidencePanel({
  citations,
  activeCitationId,
  onSelect,
  onClose,
}: EvidencePanelProps) {
  return (
    <aside className={styles.evidencePanel} aria-label="Retrieved evidence">
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.eyebrow}>Answer trail</span>
          <h2>Evidence</h2>
        </div>
        {onClose ? (
          <button
            className={styles.iconButton}
            type="button"
            onClick={onClose}
            aria-label="Close evidence"
          >
            <Icon name="close" />
          </button>
        ) : (
          <span className={styles.evidenceCount}>{citations.length}</span>
        )}
      </div>

      {citations.length ? (
        <div className={styles.evidenceList}>
          {citations.map((citation, index) => {
            const isActive = activeCitationId === citation.id;
            return (
              <article
                key={citation.id}
                className={`${styles.evidenceCard} ${isActive ? styles.evidenceActive : ""}`}
              >
                <button type="button" onClick={() => onSelect(citation.id)}>
                  <span className={styles.evidenceTopline}>
                    <span className={styles.citationNumber}>{index + 1}</span>
                    <span>Page {citation.pageNumber}</span>
                    <span className={styles.relevance}>{relevanceLabel(citation.score)}</span>
                  </span>
                  <strong>{citation.title}</strong>
                  <blockquote>{citation.excerpt}</blockquote>
                  <span className={styles.scoreBar}>
                    <span style={{ width: `${Math.round(citation.score * 100)}%` }} />
                  </span>
                </button>
                <a href={citation.previewUrl} target="_blank" rel="noreferrer">
                  Open source <Icon name="external" />
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.evidenceEmpty}>
          <span className={styles.emptyIllustration}>
            <Icon name="quote" />
          </span>
          <h3>Evidence will appear here</h3>
          <p>Ask a question and the passages used for the answer will stay visible beside it.</p>
        </div>
      )}

      <div className={styles.evidenceNote}>
        <Icon name="layers" />
        <p>
          <strong>Grounded by design.</strong>
          Scores show retrieval relevance, not factual certainty.
        </p>
      </div>
    </aside>
  );
}
