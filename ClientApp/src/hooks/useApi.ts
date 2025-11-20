import { useState, useCallback } from 'react';
import { ApiError } from './useErrorHandler';

export interface ApiResponse<T = any> {
  status: 'ok' | 'error';
  message?: string;
  data?: T;
  error_code?: string;
  validation_errors?: Record<string, string[]>;
  timestamp?: string;
}

export interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  hasError: boolean;
}

export const useApi = <T = any>() => {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
    hasError: false
  });

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      hasError: false
    }));
  }, []);

  const fetchData = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasError: false
    }));

    try {
      const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        let errorData: ApiError;
        
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            status: 'error',
            message: `Error HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString()
          };
        }

        setState({
          data: null,
          isLoading: false,
          error: errorData,
          hasError: true
        });

        throw new Error(errorData.message || `Error HTTP ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (result.status === 'error') {
        const apiError: ApiError = {
          status: 'error',
          message: result.message || 'Error en la respuesta del servidor',
          error_code: result.error_code,
          validation_errors: result.validation_errors,
          timestamp: result.timestamp
        };

        setState({
          data: null,
          isLoading: false,
          error: apiError,
          hasError: true
        });

        throw new Error(apiError.message);
      }

      setState({
        data: result.data || null,
        isLoading: false,
        error: null,
        hasError: false
      });

      return result.data || null;

    } catch (error) {
      const apiError: ApiError = error instanceof Error 
        ? {
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
          }
        : {
            status: 'error',
            message: 'Error de conexión',
            timestamp: new Date().toISOString()
          };

      setState({
        data: null,
        isLoading: false,
        error: apiError,
        hasError: true
      });

      throw error;
    }
  }, []);

  const post = useCallback((url: string, data: any) => {
    return fetchData(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }, [fetchData]);

  const get = useCallback((url: string) => {
    return fetchData(url, { method: 'GET' });
  }, [fetchData]);

  const put = useCallback((url: string, data: any) => {
    return fetchData(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }, [fetchData]);

  const del = useCallback((url: string) => {
    return fetchData(url, { method: 'DELETE' });
  }, [fetchData]);

  return {
    ...state,
    clearError,
    fetchData,
    post,
    get,
    put,
    delete: del
  };
};