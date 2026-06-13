import { useState, useCallback } from 'react';
import api from '../utils/api';
import { ApiResponse } from '../types';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T,>(
      method: 'get' | 'post' | 'put' | 'delete',
      url: string,
      data?: any,
      options?: UseApiOptions
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api[method]<ApiResponse<T>>(url, data);

        if (!response.data.success) {
          throw new Error(response.data.error || 'Request failed');
        }

        options?.onSuccess?.(response.data.data);
        setLoading(false);
        return response.data.data || null;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
        setError(errorMessage);
        options?.onError?.(err);
        setLoading(false);
        return null;
      }
    },
    []
  );

  return { request, loading, error };
};
