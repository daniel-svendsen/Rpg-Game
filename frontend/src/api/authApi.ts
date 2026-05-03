import type { AuthResponse } from "../auth/authTypes";
import { jsonRequest } from "./http";

export const register = async (email: string, password: string): Promise<AuthResponse> =>
  jsonRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const login = async (email: string, password: string): Promise<AuthResponse> =>
  jsonRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

