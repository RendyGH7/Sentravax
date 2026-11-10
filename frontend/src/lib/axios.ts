import axios from 'axios';

const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const host = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
  return `http://${host}:8000/api/v1`;
};

export const apiClient = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

// Request interceptor: attach token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentravax_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, token might be invalid or expired
    if (error.response?.status === 401) {
      const currentToken = localStorage.getItem('sentravax_auth_token');
      if (currentToken) {
        localStorage.removeItem('sentravax_auth_token');
        localStorage.removeItem('sentravax_user');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

