<?php

/**
 * Configuración global para manejo de errores y logging
 * Incluir este archivo al inicio de cada API endpoint
 */

require_once __DIR__ . '/ErrorLoggingMiddleware.php';

// Inicializar el middleware de logging
ErrorLoggingMiddleware::initialize();

// Configurar manejo de errores personalizado
set_error_handler(function($severity, $message, $file, $line) {
    $context = [
        'severity' => $severity,
        'file' => $file,
        'line' => $line,
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ];
    
    // Log según la severidad
    if ($severity & (E_ERROR | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR)) {
        logError("PHP Error: $message", $context);
    } elseif ($severity & (E_WARNING | E_CORE_WARNING | E_COMPILE_WARNING | E_USER_WARNING)) {
        logWarning("PHP Warning: $message", $context);
    } else {
        logInfo("PHP Notice: $message", $context);
    }
    
    // Permitir que PHP maneje el error también
    return false;
});

// Configurar manejo de excepciones no capturadas
set_exception_handler(function(Throwable $exception) {
    $context = [
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString(),
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ];
    
    logError("Uncaught Exception: " . $exception->getMessage(), $context);
    
    // Si es una excepción personalizada, usar su respuesta
    if ($exception instanceof BaseException) {
        $exception->sendJsonResponse();
    } else {
        // Respuesta genérica para excepciones no manejadas
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'error',
            'message' => 'Error interno del servidor',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    exit();
});

// Log de shutdown para detectar errores fatales
register_shutdown_function(function() {
    $lastError = error_get_last();
    if ($lastError && in_array($lastError['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
        $context = [
            'type' => $lastError['type'],
            'file' => $lastError['file'],
            'line' => $lastError['line'],
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
        ];
        
        logError("Fatal Error: " . $lastError['message'], $context);
    }
});

// Función de conveniencia para logging de actividad de usuario
function logUserActivity(string $action, array $details = []): void {
    $context = array_merge([
        'action' => $action,
        'user_id' => $_SESSION['usuario_id'] ?? null,
        'user_role' => $_SESSION['rol'] ?? null,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ], $details);
    
    logAudit("User Activity: $action", $context);
}

// Función para validar y sanitizar entrada de API
function validateApiInput(array $requiredFields, array $data): array {
    $missing = [];
    $sanitized = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        } else {
            // Sanitización básica
            $sanitized[$field] = trim($data[$field]);
        }
    }
    
    if (!empty($missing)) {
        logWarning('Missing required fields in API request', [
            'missing_fields' => $missing,
            'provided_fields' => array_keys($data)
        ]);
        
        throw ExceptionFactory::createMissingFieldsException($missing);
    }
    
    return $sanitized;
}

// Función para log de performance
function logPerformance(string $operation, float $startTime, array $context = []): void {
    $duration = microtime(true) - $startTime;
    $memoryUsage = memory_get_peak_usage(true);
    
    $performanceContext = array_merge([
        'operation' => $operation,
        'duration_ms' => round($duration * 1000, 2),
        'memory_mb' => round($memoryUsage / 1024 / 1024, 2)
    ], $context);
    
    if ($duration > 5.0) { // Log operaciones lentas
        logWarning("Slow operation detected: $operation", $performanceContext);
    } else {
        logInfo("Performance: $operation", $performanceContext);
    }
}

// Configurar headers de seguridad básicos
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Log del inicio de la request
$requestStart = microtime(true);
logInfo('API Request started', [
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
]);

// Registrar función para log del final de la request
register_shutdown_function(function() use ($requestStart) {
    logPerformance('API Request completed', $requestStart, [
        'response_code' => http_response_code()
    ]);
});