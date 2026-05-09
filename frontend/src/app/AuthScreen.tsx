import type { ReactNode } from "react";
import type { AuthFieldErrors, AuthFormState } from "../auth/authTypes";

interface AuthScreenProps {
  feedback: ReactNode;
  authMode: "login" | "register";
  authForm: AuthFormState;
  authFieldErrors: AuthFieldErrors;
  onChangeAuthForm: (nextForm: AuthFormState) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
}

export const AuthScreen = ({
  feedback,
  authMode,
  authForm,
  authFieldErrors,
  onChangeAuthForm,
  onSubmit,
  onToggleMode
}: AuthScreenProps) => {
  const trimmedEmail = authForm.email.trim();
  const hasTypedEmail = trimmedEmail.length > 0;
  const hasTypedPassword = authForm.password.length > 0;
  const emailLooksValid = /\S+@\S+\.\S+/.test(trimmedEmail);
  const passwordIsLongEnough = authForm.password.length >= 8;
  const canSubmit = emailLooksValid && passwordIsLongEnough;

  return (
    <div className="content">
      {feedback}
      <div className="auth-logo-section">
        <div className="auth-logo-emblem">⚔</div>
        <h1 className="auth-logo-title">SHARDBORNE</h1>
        <p className="auth-logo-tagline">Path of Exile — Minigame</p>
        <div className="auth-logo-divider" />
      </div>
      <section className="panel stack auth-panel">
        <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button
            className={authMode === "register" ? "primary-button" : "secondary-button"}
            onClick={authMode === "register" ? undefined : onToggleMode}
            type="button"
          >
            Register
          </button>
          <button
            className={authMode === "login" ? "primary-button" : "secondary-button"}
            onClick={authMode === "login" ? undefined : onToggleMode}
            type="button"
          >
            Login
          </button>
        </div>
        <div className="stack compact-stack">
          <h3>{authMode === "register" ? "Create account" : "Welcome back"}</h3>
          <p className="status-text">
            Use a valid email and a password with at least 8 characters.
          </p>
        </div>
        <div className="form-grid">
          <label className="field-stack">
            <span>Email</span>
            <input
              className="text-input"
              placeholder="you@example.com"
              type="email"
              value={authForm.email}
              onChange={(event) => onChangeAuthForm({ ...authForm, email: event.target.value })}
            />
            {authFieldErrors.email ? (
              <span className="error-text">{authFieldErrors.email}</span>
            ) : hasTypedEmail && !emailLooksValid ? (
              <span className="error-text">Enter a valid email address.</span>
            ) : (
              <span className="status-text">This will be your account login.</span>
            )}
          </label>
          <label className="field-stack">
            <span>Password</span>
            <input
              className="text-input"
              placeholder="At least 8 characters"
              type="password"
              value={authForm.password}
              onChange={(event) => onChangeAuthForm({ ...authForm, password: event.target.value })}
            />
            <span
              className={
                authFieldErrors.password || (hasTypedPassword && !passwordIsLongEnough)
                  ? "error-text"
                  : "status-text"
              }
            >
              {authFieldErrors.password
                ? authFieldErrors.password
                : passwordIsLongEnough
                ? "Password length looks good."
                : `Minimum 8 characters. Current length: ${authForm.password.length}`}
            </span>
          </label>
        </div>
        <div className="actions">
          <button className="primary-button" disabled={!canSubmit} onClick={onSubmit} type="button">
            {authMode === "register" ? "Create account" : "Login"}
          </button>
          <button className="secondary-button" onClick={onToggleMode} type="button">
            Switch to {authMode === "register" ? "login" : "register"}
          </button>
        </div>
      </section>
    </div>
  );
};
