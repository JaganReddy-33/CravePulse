import { useState, useEffect, useCallback, useRef } from 'react';
import api, { ApiError } from '../services/api';

/**
 * Standardized data-fetching & mutation hook.
 * Features:
 * - Auto-cancellation on component unmount
 * - Loading, error, data state tracking
 * - Refetch and manual execute capability
 * - Typed ApiError normalization
 *
 * @param {Function} apiFunc - Function returning a Promise (e.g. (args) => api.get('/path', args))
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to invoke apiFunc immediately on mount (default: false)
 * @param {any} options.initialData - Initial data state (default: null)
 * @param {Array} options.params - Default parameters passed to apiFunc when immediate is true
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 */
export function useApi(apiFunc, options = {}) {
  const {
    immediate = false,
    initialData = null,
    params = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const cancelSourceRef = useRef(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(
    async (...args) => {
      // Cancel any ongoing request from previous execution
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel('Operation superseded by newer request');
      }

      const source = api.createCancelSource();
      cancelSourceRef.current = source;

      setLoading(true);
      setError(null);

      try {
        // Pass cancellation token inside Axios config if supported
        const callArgs = args.length > 0 ? args : params;
        const response = await apiFunc(...callArgs, { cancelToken: source.token });

        if (isMountedRef.current) {
          // If response wrapped in standard { success: true, data: ... }, unwrap data
          const resolvedData = response && typeof response === 'object' && 'data' in response && response.success !== undefined
            ? response.data
            : response;

          setData(resolvedData);
          setLoading(false);
          if (onSuccess) onSuccess(resolvedData);
          return resolvedData;
        }
      } catch (err) {
        if (api.isCancel(err)) {
          // Gracefully ignore cancellation
          return null;
        }

        const normalizedError = err instanceof ApiError
          ? err
          : new ApiError({
              message: err?.message || 'Failed to process request',
              code: err?.code || 'FETCH_ERROR',
              status: err?.status || 0,
            });

        if (isMountedRef.current) {
          setError(normalizedError);
          setLoading(false);
          if (onError) onError(normalizedError);
        }
        throw normalizedError;
      }
    },
    [apiFunc, onSuccess, onError, ...params]
  );

  const cancel = useCallback((reason = 'Component cancelled request') => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel(reason);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel('Component unmounted');
      }
    };
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    cancel,
    setData,
  };
}

export default useApi;
