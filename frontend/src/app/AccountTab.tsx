import { useState, type ReactNode } from "react";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface AccountTabProps {
  topBar: ReactNode;
  accountEmail: string;
  character: CharacterRecord | null;
  onLogout: () => void;
  onSwitchCharacter: () => void;
  onDeleteCharacter: () => Promise<void>;
}

export const AccountTab = ({
  topBar,
  accountEmail,
  character,
  onLogout,
  onSwitchCharacter,
  onDeleteCharacter
}: AccountTabProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <h4>Account</h4>
        <div className="status-text">Email: {accountEmail || "Current session"}</div>
        <div className="status-text">Character: {character?.name ?? "None"}</div>
        <div className="status-text">Level: {character?.level ?? 0}</div>
        <div className="actions">
          <button className="secondary-button" onClick={onSwitchCharacter}>
            Switch Character
          </button>
          <button className="secondary-button" onClick={onLogout}>
            Log out
          </button>
        </div>
        {character ? (
          <div className="actions">
            {showDeleteConfirm ? (
              <>
                <p className="status-text">Delete {character.name}? This cannot be undone.</p>
                <button
                  className="secondary-button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    await onDeleteCharacter();
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                  }}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button className="secondary-button" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="secondary-button" onClick={() => setShowDeleteConfirm(true)}>
                Delete Character
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
};
