import axios from 'axios';

/**
 * Determine root backend URL while guaranteeing exact hostname matching (localhost vs 127.0.0.1)
 * to avoid browser cookie cross-origin domain isolation issues.
 */
export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  const host = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
  return `http://${host}:8000`;
};

/**
 * Determine API v1 base URL.
 */
export const getBaseApiUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1')) {
    return envApiUrl;
  }
  return `${getBackendBaseUrl()}/api/v1`;
};

/**
 * Core Axios client for SENTRAVAX SPA.
 * - withCredentials: true ensures HttpOnly session cookies are transmitted on every request.
 * - withXSRFToken: true ensures Axios automatically extracts XSRF-TOKEN cookie and passes X-XSRF-TOKEN header.
 * - Zero localStorage tokens or credentials stored or attached.
 */
export const apiClient = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

/**
 * Fetch Sanctum CSRF cookie prior to any stateful mutations (login, register).
 * Must be awaited before initiating the mutation request.
 */
export const ensureCsrfCookie = async (): Promise<void> => {
  const backendRoot = getBackendBaseUrl();
  await axios.get(`${backendRoot}/sanctum/csrf-cookie`, {
    withCredentials: true,
    withXSRFToken: true,
    headers: {
      'Accept': 'application/json',
    },
  });
};

/**
 * Backwards compatibility alias for getCsrfCookie.
 */
export const getCsrfCookie = ensureCsrfCookie;

export default apiClient;
