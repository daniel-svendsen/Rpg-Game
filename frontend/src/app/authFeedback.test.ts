import { describe, expect, it } from "vitest";
import type { ApiRequestError } from "../api/http";
import { resolveAuthErrorMessage } from "./authFeedback";

describe("resolveAuthErrorMessage", () => {
  it("maps invalid credentials to a friendly login message", () => {
    const error = new Error("Incorrect email or password.") as ApiRequestError;
    error.code = "INVALID_CREDENTIALS";
    error.status = 401;

    expect(resolveAuthErrorMessage(error)).toBe("Incorrect email or password.");
  });

  it("maps duplicate email to a register-specific message", () => {
    const error = new Error("An account with this email already exists.") as ApiRequestError;
    error.code = "EMAIL_ALREADY_REGISTERED";
    error.status = 409;

    expect(resolveAuthErrorMessage(error)).toBe("An account with this email already exists.");
  });

  it("maps generic network failures to a backend availability message", () => {
    const error = new Error("Failed to fetch") as ApiRequestError;

    expect(resolveAuthErrorMessage(error)).toBe("Could not reach the backend. Check that the dev server is running.");
  });
});
