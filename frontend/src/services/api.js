import { getAccessToken, setAccessToken } from './session';
import axios from 'axios';

/**
 * Standardized ApiError representing typed application and network faults.
 */
export class ApiError extends Error {
  constructor({ message, code = 'UNKNOWN_ERROR', status = 0, details = null, isNetwork = false, isCancelled = false }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.isNetwork = isNetwork;
    this.isCancelled = isCancelled;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://cravepulse-74ry.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Idempotent retry helper constants
const MAX_IDEMPOTENT_RETRIES = 2;
const RETRY_DELAY_MS = 600;
const RETRYABLE_STATUS_CODES = [502, 503, 504];

let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: retry on idempotent GETs, safe token refresh, and structured ApiError
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // 1. Check for request cancellation
    if (axios.isCancel(error)) {
      return Promise.reject(
        new ApiError({
          message: 'Request was cancelled',
          code: 'REQUEST_CANCELLED',
          status: 0,
          isCancelled: true,
        })
      );
    }

    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(
        new ApiError({
          message: error.message || 'Unknown network error',
          code: 'NETWORK_ERROR',
          isNetwork: true,
        })
      );
    }

    // 2. Retry on Idempotent GET / HEAD requests if network error or server gateway error
    const method = (originalRequest.method || 'get').toLowerCase();
    const isIdempotent = ['get', 'head', 'options'].includes(method);
    const isNetworkError = !error.response;
    const isRetryableStatus = error.response && RETRYABLE_STATUS_CODES.includes(error.response.status);

    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (isIdempotent && (isNetworkError || isRetryableStatus) && originalRequest._retryCount < MAX_IDEMPOTENT_RETRIES) {
      originalRequest._retryCount += 1;
      const delay = RETRY_DELAY_MS * Math.pow(2, originalRequest._retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // 3. Handle 401 Unauthorized with concurrency-safe refresh token exchange
    if (error.response && error.response.status === 401 && !originalRequest._isRetryAuth && !/\/auth\/(login|register|refresh|logout)$/.test(originalRequest.url)) {
      originalRequest._isRetryAuth = true;

      if (isRefreshing) {
        // Wait for active refresh to complete
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(
                new ApiError({
                  message: 'Session expired. Please sign in again.',
                  code: 'UNAUTHORIZED',
                  status: 401,
                })
              );
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(`${api.defaults.baseURL.replace(/\/$/, '')}/auth/refresh`, {}, { withCredentials: true, timeout: 15000 });
        if (res.data && res.data.success) {
          const { accessToken } = res.data.data;
          setAccessToken(accessToken);

          onTokenRefreshed(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh token rejected');
        }
      } catch (refreshErr) {
        onTokenRefreshed(null);
        setAccessToken(null);
        window.dispatchEvent(new Event('session-expired'));
        return Promise.reject(
          new ApiError({
            message: 'Session expired. Please sign in again.',
            code: 'SESSION_EXPIRED',
            status: 401,
          })
        );
      } finally {
        isRefreshing = false;
      }
    }

    // 4. Construct typed ApiError from backend payload
    let errorMsg = 'An unexpected server error occurred';
    let errorCode = 'SERVER_ERROR';
    let details = null;

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data.error === 'object' && data.error !== null) {
        errorMsg = data.error.message || errorMsg;
        errorCode = data.error.code || errorCode;
        details = data.error.details || null;
      } else if (typeof data.error === 'string') {
        errorMsg = data.error;
      } else if (typeof data.message === 'string') {
        errorMsg = data.message;
      }
    } else if (error.request) {
      errorMsg = 'Cannot reach CravePulse server. Please check your network connection.';
      errorCode = 'NETWORK_ERROR';
    } else {
      errorMsg = error.message || errorMsg;
    }

    return Promise.reject(
      new ApiError({
        message: errorMsg,
        code: errorCode,
        status: error.response?.status || 0,
        details,
        isNetwork: !error.response,
        isCancelled: false,
      })
    );
  }
);

// Helpers for request cancellation
api.createCancelSource = () => axios.CancelToken.source();
api.isCancel = (error) => axios.isCancel(error) || error?.isCancelled === true;

export default api;
