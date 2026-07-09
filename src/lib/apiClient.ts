import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage, AppError, ErrorCodes } from './errorHandler';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const DEBUG_API = (import.meta.env.VITE_API_DEBUG || 'false') === 'true';
const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '30000');
const MAX_RETRIES = parseInt(import.meta.env.VITE_MAX_RETRIES || '3');

// Flag to suppress 401 redirect during login/auth flows
let suppress401Redirect = false;
export function setSuppressAuthRedirect(value: boolean) {
  suppress401Redirect = value;
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.defaults.withCredentials = true;

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const cookieToken = getCookie('access_token');
    const storageToken = localStorage.getItem('auth_token');
    const token = cookieToken || storageToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (DEBUG_API) {
      try {
        const method = (config.method || 'GET').toUpperCase();
        const url = `${config.baseURL || ''}${config.url}`;
        const authHeader = config.headers?.Authorization ? String(config.headers.Authorization) : 'none';
        const masked = authHeader && authHeader !== 'none' ? `${authHeader.slice(0, 12)}...` : 'none';
        const cookieNames = typeof document !== 'undefined' ? getCookieNames() : 'no-doc';
        console.debug(`[api][req] ${method} ${url} auth=${masked} cookies=${cookieNames}`);
      } catch {
        /* no-op */
      }
    }

    config.headers['X-Request-ID'] = generateRequestId();
    return config;
  },
  (error: AxiosError) => Promise.reject(new AppError('Request configuration error', ErrorCodes.INVALID_INPUT, 400, error))
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (DEBUG_API) {
      try {
        console.debug(
          `[api][res] ${error.config?.method?.toUpperCase() || 'HTTP'} ${error.config?.url} status=${error.response?.status} ` +
          `auth=${String(error.config?.headers?.Authorization || 'none').slice(0, 12)}...`
        );
      } catch {
        /* no-op */
      }
    }

    const config = error.config as InternalAxiosRequestConfig & { retryCount?: number };
    if (!error.response) return Promise.reject(new AppError('Network error. Please check your connection.', ErrorCodes.NETWORK_ERROR, 0));

    switch (error.response.status) {
      case 401:
        if (!suppress401Redirect) {
          localStorage.removeItem('auth_token');
          window.location.href = '/auth';
        }
        return Promise.reject(new AppError('Your session has expired. Please login again.', ErrorCodes.SESSION_EXPIRED, 401));
      case 403:
        return Promise.reject(new AppError('You do not have permission to access this resource.', ErrorCodes.FORBIDDEN, 403));
      case 404:
        return Promise.reject(new AppError('The requested resource was not found.', ErrorCodes.NOT_FOUND, 404));
      case 429:
        if (!config.retryCount) config.retryCount = 0;
        if (config.retryCount < MAX_RETRIES) {
          config.retryCount++;
          const delay = Math.pow(2, config.retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return axiosInstance(config);
        }
        return Promise.reject(new AppError('Too many requests. Please try again later.', 'RATE_LIMIT', 429));
      case 500:
      case 502:
      case 503:
      case 504:
        return Promise.reject(new AppError('Server error. Please try again later.', ErrorCodes.SERVICE_UNAVAILABLE, error.response.status));
      default:
        return Promise.reject(new AppError(getErrorMessage(error.response.data) || 'An error occurred', ErrorCodes.API_ERROR, error.response.status, error.response.data));
    }
  }
);

export const apiClient = {
  get: async <T>(url: string, config?: any): Promise<T> => (await axiosInstance.get<T>(url, config)).data,
  post: async <T>(url: string, data?: any, config?: any): Promise<T> => (await axiosInstance.post<T>(url, data, config)).data,
  put: async <T>(url: string, data?: any, config?: any): Promise<T> => (await axiosInstance.put<T>(url, data, config)).data,
  patch: async <T>(url: string, data?: any, config?: any): Promise<T> => (await axiosInstance.patch<T>(url, data, config)).data,
  delete: async <T>(url: string, config?: any): Promise<T> => (await axiosInstance.delete<T>(url, config)).data,
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default axiosInstance;

function getCookieNames(): string {
  if (typeof document === 'undefined') return 'no-doc';
  const raw = document.cookie || '';
  if (!raw) return 'none';
  return raw.split(';').map((s) => s.split('=')[0].trim()).filter(Boolean).join(',');
}
