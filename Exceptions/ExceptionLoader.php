<?php

/**
 * Cargador de todas las excepciones personalizadas
 * Incluir este archivo para tener acceso a todas las excepciones del sistema
 */

require_once __DIR__ . '/BaseException.php';
require_once __DIR__ . '/DatabaseExceptions.php';
require_once __DIR__ . '/AuthExceptions.php';
require_once __DIR__ . '/TransactionExceptions.php';
require_once __DIR__ . '/ValidationExceptions.php';
require_once __DIR__ . '/ServiceExceptions.php';

/**
 * Factory para crear excepciones comunes
 */
class ExceptionFactory {
    
    /**
     * Crear excepción de base de datos desde error SQL Server
     */
    public static function createDatabaseException($sqlErrors): DatabaseException {
        $errorMessage = "Error de base de datos";
        if (is_array($sqlErrors) && !empty($sqlErrors)) {
            $errorMessage .= ": " . $sqlErrors[0]['message'] ?? 'Error desconocido';
        }
        return new DatabaseException($errorMessage);
    }
    
    /**
     * Crear excepción de validación desde campos faltantes
     */
    public static function createMissingFieldsException(array $missingFields): MissingFieldsException {
        return new MissingFieldsException($missingFields);
    }
    
    /**
     * Crear excepción de credenciales inválidas
     */
    public static function createInvalidCredentialsException(): InvalidCredentialsException {
        return new InvalidCredentialsException();
    }
    
    /**
     * Crear excepción de fondos insuficientes
     */
    public static function createInsufficientFundsException(): InsufficientFundsException {
        return new InsufficientFundsException();
    }
    
    /**
     * Crear excepción de cuenta no encontrada
     */
    public static function createAccountNotFoundException(): AccountNotFoundException {
        return new AccountNotFoundException();
    }
    
    /**
     * Crear excepción de monto inválido
     */
    public static function createInvalidAmountException(): InvalidAmountException {
        return new InvalidAmountException();
    }
}

/**
 * Handler global para excepciones no capturadas
 */
class GlobalExceptionHandler {
    
    public static function register(): void {
        set_exception_handler([self::class, 'handleUncaughtException']);
        set_error_handler([self::class, 'handleError']);
    }
    
    public static function handleUncaughtException(Throwable $exception): void {
        // Log del error
        error_log("Uncaught exception: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine());
        
        // Si es una excepción personalizada, usar su respuesta JSON
        if ($exception instanceof BaseException) {
            $exception->sendJsonResponse();
        } else {
            // Para excepciones estándar, respuesta genérica
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'status' => 'error',
                'message' => 'Error interno del servidor',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        exit();
    }
    
    public static function handleError($severity, $message, $file, $line): bool {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        
        error_log("PHP Error [$severity]: $message in $file:$line");
        
        // Convertir errores fatales en excepciones
        if ($severity & (E_ERROR | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR)) {
            throw new ErrorException($message, 0, $severity, $file, $line);
        }
        
        return true;
    }
}