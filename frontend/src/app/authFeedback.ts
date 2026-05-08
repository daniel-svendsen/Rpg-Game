import type { ApiRequestError } from "../api/http";

export const resolveAuthErrorMessage = (error: ApiRequestError): string => {
  if (error.code === "INVALID_CREDENTIALS") {
    return "Incorrect email or password.";
  }

  if (error.code === "EMAIL_ALREADY_REGISTERED") {
    return "An account with this email already exists.";
  }

  if (error.code === "INVALID_REQUEST") {
    return "Please correct the highlighted fields.";
  }

  if (error.status && error.status >= 500) {
    return "The server could not process the request. Please try again.";
  }

  if (!error.status) {
    return "Could not reach the backend. Check that the dev server is running.";
  }

  return error.message || "Authentication failed.";
};
