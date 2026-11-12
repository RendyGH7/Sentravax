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
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.status === 401) {
      return 'Sesi autentikasi telah berakhir. Silakan masuk kembali.';
    }

    if (error.response?.status === 403) {
      return 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini.';
    }

    if (error.response?.status === 404) {
      return 'Data atau sumber daya yang diminta tidak ditemukan.';
    }

    if (error.response?.status === 422) {
      const validationErrors = error.response.data?.errors;
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        const firstField = Object.keys(validationErrors)[0];
        return validationErrors[firstField][0] || 'Data masukan tidak valid.';
      }
      return 'Validasi formulir gagal. Periksa kembali isian Anda.';
    }

    if (error.response?.status && error.response.status >= 500) {
      return 'Layanan server sedang dalam pemeliharaan atau tidak dapat merespons.';
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Koneksi jaringan terputus atau server tidak dapat dihubungi.';
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

