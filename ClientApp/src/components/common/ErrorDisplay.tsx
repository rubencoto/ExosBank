import React from 'react';
import { AlertTriangle, X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { ApiError } from '../../hooks/useErrorHandler';

export interface ErrorDisplayProps {
  error: ApiError | null;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

const getErrorIcon = (errorCode?: string) => {
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return <AlertCircle className="h-4 w-4" />;
    case 'AUTH_ERROR':
    case 'INVALID_CREDENTIALS':
    case 'SESSION_EXPIRED':
      return <AlertTriangle className="h-4 w-4" />;
    case 'INSUFFICIENT_FUNDS':
    case 'ACCOUNT_NOT_FOUND':
    case 'TRANSACTION_ERROR':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getErrorVariant = (errorCode?: string) => {
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return 'default';
    case 'AUTH_ERROR':
    case 'INVALID_CREDENTIALS':
    case 'SESSION_EXPIRED':
      return 'destructive';
    case 'INSUFFICIENT_FUNDS':
    case 'ACCOUNT_NOT_FOUND':
      return 'default';
    default:
      return 'destructive';
  }
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  showDismiss = true,
  className = ''
}) => {
  if (!error) return null;

  const variant = getErrorVariant(error.error_code);
  const icon = getErrorIcon(error.error_code);

  return (
    <Alert variant={variant} className={`${className} relative`}>
      {icon}
      <AlertTitle className="flex items-center justify-between">
        <span>Error</span>
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p className="text-sm">{error.message}</p>
          
          {error.error_code && (
            <p className="text-xs text-muted-foreground mt-1">
              Código: {error.error_code}
            </p>
          )}
          
          {error.validation_errors && Object.keys(error.validation_errors).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Errores de validación:
              </p>
              <ul className="text-xs space-y-1">
                {Object.entries(error.validation_errors).map(([field, errors]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {Array.isArray(errors) ? errors.join(', ') : String(errors)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {error.timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(error.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export interface SuccessDisplayProps {
  message: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({
  message,
  onDismiss,
  showDismiss = true,
  className = ''
}) => {
  return (
    <Alert variant="default" className={`${className} relative border-green-200 bg-green-50`}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="flex items-center justify-between text-green-800">
        <span>Éxito</span>
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-transparent text-green-600"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="text-green-700">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export interface LoadingDisplayProps {
  message?: string;
  className?: string;
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({
  message = 'Cargando...',
  className = ''
}) => {
  return (
    <Alert variant="default" className={`${className} border-blue-200 bg-blue-50`}>
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Procesando
        </div>
      </AlertTitle>
      <AlertDescription className="text-blue-700">
        {message}
      </AlertDescription>
    </Alert>
  );
};