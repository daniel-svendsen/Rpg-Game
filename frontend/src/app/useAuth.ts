import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ApiRequestError } from "../api/http";
import { login, register } from "../api/authApi";
import type { AuthFieldErrors, AuthFormState } from "../auth/authTypes";
import { resolveAuthErrorMessage } from "./authFeedback";
import { accountEmailStorageKey, tokenStorageKey } from "./appUiHelpers";

export type AuthMode = "login" | "register";

export type AuthSubmitResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export interface UseAuthResult {
  token: string | null;
  setToken: Dispatch<SetStateAction<string | null>>;
  accountEmail: string;
  authMode: AuthMode;
  authForm: AuthFormState;
  authFieldErrors: AuthFieldErrors;
  changeAuthForm: (form: AuthFormState) => void;
  toggleAuthMode: () => void;
  submitAuth: () => Promise<AuthSubmitResult>;
  clearSession: () => void;
}

const initialAuthForm: AuthFormState = {
  email: "",
  password: ""
};

export const useAuth = (): UseAuthResult => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenStorageKey));
  const [accountEmail, setAccountEmail] = useState<string>(() => localStorage.getItem(accountEmailStorageKey) ?? "");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authForm, setAuthForm] = useState<AuthFormState>(initialAuthForm);
  const [authFieldErrors, setAuthFieldErrors] = useState<AuthFieldErrors>({});

  useEffect(() => {
    if (token) {
      localStorage.setItem(tokenStorageKey, token);
    } else {
      localStorage.removeItem(tokenStorageKey);
    }
  }, [token]);

  useEffect(() => {
    if (accountEmail) {
      localStorage.setItem(accountEmailStorageKey, accountEmail);
    } else {
      localStorage.removeItem(accountEmailStorageKey);
    }
  }, [accountEmail]);

  const changeAuthForm = useCallback((nextForm: AuthFormState) => {
    setAuthForm(nextForm);
    setAuthFieldErrors({});
  }, []);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((current) => (current === "register" ? "login" : "register"));
    setAuthFieldErrors({});
  }, []);

  const submitAuth = useCallback(async (): Promise<AuthSubmitResult> => {
    setAuthFieldErrors({});

    try {
      const response =
        authMode === "register"
          ? await register(authForm.email, authForm.password)
          : await login(authForm.email, authForm.password);

      setToken(response.token);
      setAccountEmail(authForm.email);

      return {
        status: "success",
        message: authMode === "register" ? "Account created." : "Login successful."
      };
    } catch (error) {
      const requestError = error as ApiRequestError;
      setAuthFieldErrors((requestError.fieldErrors as AuthFieldErrors | undefined) ?? {});

      return {
        status: "error",
        message: error instanceof Error ? resolveAuthErrorMessage(requestError) : "Authentication failed."
      };
    }
  }, [authForm.email, authForm.password, authMode]);

  const clearSession = useCallback(() => {
    setToken(null);
    setAccountEmail("");
  }, []);

  return {
    token,
    setToken,
    accountEmail,
    authMode,
    authForm,
    authFieldErrors,
    changeAuthForm,
    toggleAuthMode,
    submitAuth,
    clearSession
  };
};
