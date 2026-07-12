import axios from 'axios';
import { clearAuthState } from './auth';

// SECURITY: Base URL from env variable (not hardcoded)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';


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

// Endpoints where a 401 is an *expected* possible response
// (bad credentials, missing MFA code, etc.) - never redirect for these.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

// Response interceptor (handle 401 globally for protected routes only)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) =>
      error.config?.url?.includes(path)
    );
    const alreadyOnPublicPage = ['/login', '/register', '/'].includes(
      window.location.pathname
    );

    if (error.response?.status === 401 && !isAuthEndpoint && !alreadyOnPublicPage) {
      clearAuthState();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Wrapper for API calls
async function apiCall(method, url, data = null, config = {}) {
  try {
    const requestConfig = { method, url, ...config };

    // SECURITY: Only attach a request body if data was actually provided.
    // Sending a literal `null` body with Content-Type: application/json
    // fails body-parser's strict JSON check ("null" is not a JSON object/array),
    // which breaks any no-payload POST (e.g. /auth/enable-mfa, /auth/logout).
    if (data !== null && data !== undefined) {
      requestConfig.data = data;
    }

    const response = await api(requestConfig);
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