import { useState, useCallback } from 'react';

export interface ApiError {
  status: 'error';
  message: string;
  error_code?: string;
  validation_errors?: Record<string, string[]>;
  timestamp?: string;
}

export interface ErrorState {
  hasError: boolean;
  error: ApiError | null;
  isLoading: boolean;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isLoading: false
  });

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      hasError: false,
      error: null
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setErrorState(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  const handleError = useCallback((error: unknown): ApiError => {
    console.error('Error capturado:', error);
    
    let apiError: ApiError;

    if (error instanceof Error) {
      // Error de JavaScript estándar
      apiError = {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    } else if (typeof error === 'object' && error !== null) {
      // Posible respuesta de API
      const errorObj = error as any;
      apiError = {
        status: 'error',
        message: errorObj.message || 'Error desconocido',
        error_code: errorObj.error_code,
        validation_errors: errorObj.validation_errors,
        timestamp: errorObj.timestamp || new Date().toISOString()
      };
    } else {
      // Error desconocido
      apiError = {
        status: 'error',
        message: 'Error inesperado',
        timestamp: new Date().toISOString()
      };
    }

    setErrorState({
      hasError: true,
      error: apiError,
      isLoading: false
    });

    return apiError;
  }, []);

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: ApiError) => void;
      clearPreviousError?: boolean;
    }
  ): Promise<T | null> => {
    try {
      if (options?.clearPreviousError !== false) {
        clearError();
      }
      
      setLoading(true);
      const result = await asyncFn();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const apiError = handleError(error);
      
      if (options?.onError) {
        options.onError(apiError);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, setLoading]);

  return {
    ...errorState,
    clearError,
    setLoading,
    handleError,
    executeAsync
  };
};