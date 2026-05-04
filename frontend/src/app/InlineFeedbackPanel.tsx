interface InlineFeedbackPanelProps {
  statusMessage: string;
  errorMessage: string | null;
}

export const InlineFeedbackPanel = ({ statusMessage, errorMessage }: InlineFeedbackPanelProps) => {
  if (!statusMessage && !errorMessage) {
    return null;
  }

  return (
    <section className="panel stack mobile-feedback-panel">
      {statusMessage ? <p className="status-text">{statusMessage}</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </section>
  );
};
