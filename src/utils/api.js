import axios from 'axios';
import { clearAuthState } from './auth';

// SECURITY: Base URL from env variable (not hardcoded)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send cookies (httpOnly JWT)
});

// Request interceptor (CSRF defense)
api.interceptors.request.use(
  (config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle 401 globally)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthState();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Wrapper for API calls
async function apiCall(method, url, data = null, config = {}) {
  try {
    const response = await api({ method, url, data, ...config });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status || 500;
    const responseData = error.response?.data || {};
    return { success: false, message, status, data: responseData };
  }
}

export { api, apiCall };
export default api;
