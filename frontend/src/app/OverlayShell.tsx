import type { ReactNode } from "react";

interface OverlayShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const OverlayShell = ({ title, onClose, children }: OverlayShellProps) => (
  <div className="mobile-overlay" onClick={onClose}>
    <div className="mobile-panel" onClick={(event) => event.stopPropagation()}>
      <div className="inventory-row">
        <h3>{title}</h3>
        <button className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      {children}
    </div>
  </div>
);
