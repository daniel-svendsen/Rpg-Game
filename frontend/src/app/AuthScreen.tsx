import type { ReactNode } from "react";
import type { AuthFormState } from "../auth/authTypes";

interface AuthScreenProps {
  feedback: ReactNode;
  authMode: "login" | "register";
  authForm: AuthFormState;
  onChangeAuthForm: (nextForm: AuthFormState) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
}

export const AuthScreen = ({
  feedback,
  authMode,
  authForm,
  onChangeAuthForm,
  onSubmit,
  onToggleMode
}: AuthScreenProps) => (
  <div className="content">
    {feedback}
    <section className="panel stack">
      <h2>Shardborne</h2>
      <p>Build a character, run maps, collect loot, and shape your main spell with support links.</p>
    </section>
    <section className="panel stack">
      <h3>{authMode === "register" ? "Create account" : "Login"}</h3>
      <p>Use a valid email and a password with at least 8 characters.</p>
      <div className="form-grid">
        <input
          className="text-input"
          placeholder="Email"
          type="email"
          value={authForm.email}
          onChange={(event) => onChangeAuthForm({ ...authForm, email: event.target.value })}
        />
        <input
          className="text-input"
          placeholder="Password (min 8 characters)"
          type="password"
          value={authForm.password}
          onChange={(event) => onChangeAuthForm({ ...authForm, password: event.target.value })}
        />
      </div>
      <div className="actions">
        <button className="primary-button" onClick={onSubmit}>
          {authMode === "register" ? "Register" : "Login"}
        </button>
        <button className="secondary-button" onClick={onToggleMode}>
          Switch to {authMode === "register" ? "login" : "register"}
        </button>
      </div>
    </section>
  </div>
);
