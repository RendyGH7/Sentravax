import axios from 'axios';

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Extract user-friendly error message from any API error or fallback to a standard message.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan sistem. Silakan coba kembali.'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;

    // 1. HTTP 422: Validation Errors (prioritize specific field error over generic message)
    if (status === 422) {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        const firstField = Object.keys(validationErrors)[0];
        const firstMsg = validationErrors[firstField]?.[0];
        if (firstMsg) return firstMsg;
      }
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      return 'Validasi formulir gagal. Periksa kembali isian Anda.';
    }

    // 2. HTTP 419: CSRF Token Expired or Mismatch
    if (status === 419) {
      return 'Sesi keamanan (CSRF) kedaluwarsa atau tidak valid. Silakan muat ulang halaman dan coba kembali.';
    }

    // 3. HTTP 401: Unauthorized / Invalid Credentials
    if (status === 401) {
      if (error.response?.data?.message && error.response.data.message !== 'Unauthenticated.') {
        return error.response.data.message;
      }
      return 'Email atau kata sandi tidak sesuai, atau sesi autentikasi telah berakhir.';
    }

    // 4. HTTP 403: Forbidden
    if (status === 403) {
      return error.response?.data?.message || 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini.';
    }

    // 5. HTTP 404: Not Found
    if (status === 404) {
      return error.response?.data?.message || 'Data atau sumber daya yang diminta tidak ditemukan.';
    }

    // 6. HTTP 500+: Server Internal Error
    if (status && status >= 500) {
      return 'Layanan server sedang dalam pemeliharaan atau tidak dapat merespons. Silakan coba beberapa saat lagi.';
    }

    // 7. Explicit server-provided error message for other statuses
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // 8. Timeout (ECONNABORTED)
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return 'Waktu permintaan habis (timeout). Server membutuhkan waktu terlalu lama untuk merespons.';
    }

    // 9. Network Error (ERR_NETWORK) - Connection refused, DNS failure, or backend down
    if (error.code === 'ERR_NETWORK') {
      return 'Koneksi jaringan terputus atau server backend tidak dapat dihubungi. Pastikan server API aktif.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * Extract field validation errors for form fields (HTTP 422).
 */
export function getValidationErrors(error: unknown): Record<string, string[]> {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.status === 422) {
    return error.response.data?.errors || {};
  }
  return {};
}

/**
 * Check if the error is an unauthenticated error (HTTP 401).
 */
export function isAuthError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/**
 * Check if the error is a forbidden role access error (HTTP 403).
 */
export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

