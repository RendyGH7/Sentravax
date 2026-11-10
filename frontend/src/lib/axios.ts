import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standard API error handling
    return Promise.reject(error);
  }
);

export default apiClient;

