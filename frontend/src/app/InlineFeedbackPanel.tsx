interface InlineFeedbackPanelProps {
  statusMessage: string;
  errorMessage: string | null;
  showStatusMessage?: boolean;
}

export const InlineFeedbackPanel = ({
  statusMessage,
  errorMessage,
  showStatusMessage = true
}: InlineFeedbackPanelProps) => {
  const visibleStatusMessage = showStatusMessage ? statusMessage : "";

  if (!visibleStatusMessage && !errorMessage) {
    return null;
  }

  return (
    <section className="panel stack mobile-feedback-panel">
      {visibleStatusMessage ? <p className="status-text">{visibleStatusMessage}</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </section>
  );
};
