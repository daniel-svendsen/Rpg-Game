export interface AuthResponse {
  token: string;
}

export interface AuthFormState {
  email: string;
  password: string;
}

export interface AuthFieldErrors {
  email?: string;
  password?: string;
}
