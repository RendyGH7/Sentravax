import apiClient, { ensureCsrfCookie } from './axios';
import {
  type User,
  type UserRole,
  type LoginCredentials,
  type RegisterData,
  type AuthResponseData,
} from '../types/auth';
import { type ApiResponse } from '../types';

/**
 * Dedicated Authentication Service for SENTRAVAX SPA.
 * Strictly adheres to Laravel Sanctum Stateful Session Cookie (HttpOnly) authentication.
 * Never stores session identifiers, access tokens, or credentials in browser localStorage.
 */
export const authService = {
  /**
   * Check if a given user object satisfies required role(s).
   */
  hasRole(user: User | null, roles: UserRole | UserRole[]): boolean {
    if (!user) return false;
    const required = Array.isArray(roles) ? roles : [roles];
    return required.includes(user.role);
  },

  /**
   * Request CSRF cookie initialization from Sanctum.
   */
  async initCsrf(): Promise<void> {
    await ensureCsrfCookie();
  },

  /**
   * Perform user authentication against Laravel Sanctum session cookie endpoint.
   * Awaits CSRF cookie first, then posts credentials.
   * The browser automatically receives and stores the HttpOnly `laravel-session` cookie.
   */
  async login(credentials: LoginCredentials): Promise<User> {
    await ensureCsrfCookie();

    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      credentials
    );

    if (!response.data?.success || !response.data?.data?.user) {
      throw new Error(response.data?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    }

    return response.data.data.user;
  },

  /**
   * Register a new resident account against /api/v1/auth/register.
   * Awaits CSRF cookie first, then posts registration payload.
   * Strictly enforces role = 'user' on the backend.
   */
  async register(data: RegisterData): Promise<User> {
    await ensureCsrfCookie();

    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/register',
      data
    );

    if (!response.data?.success || !response.data?.data?.user) {
      throw new Error(response.data?.message || 'Registrasi akun gagal diproses.');
    }

    return response.data.data.user;
  },

  /**
   * Verify active session and retrieve fresh user identity from /api/v1/auth/me.
   * Relies entirely on the browser's HttpOnly session cookie.
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');

    if (!response.data?.success || !response.data?.data?.user) {
      throw new Error('Sesi autentikasi tidak aktif.');
    }

    return response.data.data.user;
  },

  /**
   * Invalidate active session on the backend via /api/v1/auth/logout.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Invalidation proceeds even if network error occurs
    }
  },
};

export default authService;
