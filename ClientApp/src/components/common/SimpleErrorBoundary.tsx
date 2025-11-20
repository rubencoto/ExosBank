import React, { ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Algo salió mal</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p className="text-sm">
                Se ha producido un error inesperado en la aplicación.
              </p>
              
              <details className="mt-3">
                <summary className="text-xs font-medium cursor-pointer hover:text-red-600">
                  Ver detalles técnicos
                </summary>
                <div className="mt-2 p-2 bg-red-50 rounded text-xs font-mono break-all">
                  <p><strong>Error:</strong> {error.message}</p>
                  {error.stack && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 max-h-32 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={onRetry} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </Button>
          
          <Button 
            onClick={handleRefresh} 
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recargar página
          </Button>
          
          <Button 
            onClick={handleGoHome} 
            className="w-full"
            variant="outline"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Button>
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-6">
          Si el problema persiste, contacta al soporte técnico.
        </p>
      </div>
    </div>
  );
};

// Hook personalizado para manejar errores globales
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (event.reason instanceof Error) {
        setError(event.reason);
      } else {
        setError(new Error(String(event.reason)));
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error);
      setError(event.error || new Error(event.message));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const clearError = () => setError(null);

  return { error, clearError };
};

// Componente simple para mostrar errores
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback, 
  onError 
}) => {
  const { error, clearError } = useErrorHandler();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <ErrorFallback error={error} onRetry={clearError} />;
  }

  return <>{children}</>;
};

// HOC para envolver componentes con manejo de errores
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode,
  onError?: (error: Error) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};