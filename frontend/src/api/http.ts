const resolveApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (import.meta.env.DEV) {
    return "";
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  return "http://localhost:8080";
};

const API_BASE_URL = resolveApiBaseUrl();

export const getApiBaseUrl = (): string => API_BASE_URL;

export interface ApiRequestError extends Error {
  status?: number;
  code?: string;
  fieldErrors?: Record<string, string>;
}

interface ApiErrorPayload {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export const jsonRequest = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let payload: ApiErrorPayload | null = null;
    let fallbackText = "";

    if (contentType.includes("application/json")) {
      try {
        payload = (await response.json()) as ApiErrorPayload;
      } catch {
        payload = null;
      }
    } else {
      fallbackText = await response.text();
    }

    const error = new Error(payload?.message || fallbackText || `Request failed with status ${response.status}`) as ApiRequestError;
    error.status = response.status;
    error.code = payload?.code;
    error.fieldErrors = payload?.fieldErrors;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
