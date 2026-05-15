import { useState, type ReactNode } from "react";
import type { CharacterSummary } from "../shared/types/saveTypes";

const MAX_CHARACTERS = 3;

const card: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(211, 163, 96, 0.2)",
  background: "linear-gradient(180deg, rgba(61,45,34,0.2), transparent 26%), linear-gradient(180deg, var(--bg-panel-strong), var(--bg-panel))",
  boxShadow: "inset 0 1px 0 rgba(255,241,217,0.06), 0 10px 24px rgba(0,0,0,0.18)",
};

const clickableCard: React.CSSProperties = {
  ...card,
  cursor: "pointer",
};

const compactBtn: React.CSSProperties = { padding: "5px 10px", fontSize: "0.78rem" };

interface CharacterSelectScreenProps {
  feedback: ReactNode;
  characters: CharacterSummary[];
  onSelectCharacter: (id: number) => void;
  onCreateNew: () => void;
  onDeleteCharacter: (id: number) => Promise<void>;
}

export const CharacterSelectScreen = ({
  feedback,
  characters,
  onSelectCharacter,
  onCreateNew,
  onDeleteCharacter
}: CharacterSelectScreenProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await onDeleteCharacter(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  return (
    <div className="content stack mobile-content" style={{ alignContent: "start" }}>
      {feedback}
      <div className="inventory-row" style={{ padding: "0 4px" }}>
        <h3 style={{ margin: 0 }}>Characters</h3>
        <span className="status-text">{characters.length}/{MAX_CHARACTERS}</span>
      </div>
      {characters.length === 0 && (
        <p className="status-text" style={{ padding: "0 4px" }}>No characters yet. Create one to begin.</p>
      )}
      {characters.map((c) => (
        <div key={c.id} style={card}>
          {confirmDeleteId === c.id ? (
            <>
              <span className="status-text" style={{ margin: 0 }}>Delete {c.name}? Cannot be undone.</span>
              <div className="actions">
                <button
                  className="secondary-button"
                  style={compactBtn}
                  disabled={deletingId === c.id}
                  onClick={() => void handleDelete(c.id)}
                >
                  {deletingId === c.id ? "Deleting…" : "Confirm"}
                </button>
                <button
                  className="secondary-button"
                  style={compactBtn}
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <strong>{c.name}</strong>
                <span className="status-text" style={{ marginLeft: "8px" }}>Lv {c.level}</span>
              </div>
              <div className="actions">
                <button className="secondary-button" style={compactBtn} onClick={() => setConfirmDeleteId(c.id)}>Delete</button>
                <button className="primary-button" style={compactBtn} onClick={() => onSelectCharacter(c.id)}>Play</button>
              </div>
            </>
          )}
        </div>
      ))}
      {Array.from({ length: MAX_CHARACTERS - characters.length }).map((_, i) => (
        <div key={`empty-${i}`} style={clickableCard} onClick={onCreateNew}>
          <span className="status-text">Empty slot — Create New Character</span>
        </div>
      ))}
    </div>
  );
};
