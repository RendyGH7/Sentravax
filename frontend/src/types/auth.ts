export type UserRole = 'user' | 'admin' | 'intelligence';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  phone?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
  token_type: string;
}
