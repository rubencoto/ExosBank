<?php

require_once __DIR__ . '/Exceptions/ExceptionLoader.php';

/**
 * Middleware de logging de errores y auditoría
 */
class ErrorLoggingMiddleware {
    private static $instance = null;
    private $logPath;
    private $database;
    private $enableDbLogging;
    
    private function __construct() {
        $this->logPath = __DIR__ . '/logs/';
        $this->enableDbLogging = false; // Cambiar a true para logging en BD
        
        // Crear directorio de logs si no existe
        if (!is_dir($this->logPath)) {
            mkdir($this->logPath, 0755, true);
        }
        
        // Inicializar conexión a BD para logging si está habilitado
        if ($this->enableDbLogging) {
            try {
                require_once __DIR__ . '/config/database.php';
                $this->database = new Database();
            } catch (Exception $e) {
                error_log('No se pudo inicializar BD para logging: ' . $e->getMessage());
                $this->enableDbLogging = false;
            }
        }
    }
    
    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Inicializar el middleware global
     */
    public static function initialize(): void {
        $instance = self::getInstance();
        
        // Registrar handlers globales
        GlobalExceptionHandler::register();
        
        // Configurar logging personalizado
        ini_set('log_errors', '1');
        ini_set('error_log', $instance->logPath . 'php_errors.log');
        
        // Log de inicio de sesión
        $instance->logInfo('Sistema iniciado', [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
        ]);
    }
    
    /**
     * Log de error con contexto completo
     */
    public function logError(string $message, array $context = [], string $level = 'ERROR'): void {
        $logEntry = $this->formatLogEntry($level, $message, $context);
        
        // Log a archivo
        $this->writeToFile('errors.log', $logEntry);
        
        // Log a base de datos si está habilitado
        if ($this->enableDbLogging) {
            $this->writeToDatabase($level, $message, $context);
        }
        
        // Log crítico también a syslog
        if (in_array($level, ['CRITICAL', 'EMERGENCY'])) {
            syslog(LOG_CRIT, "ExosBank: {$message}");
        }
    }
    
    /**
     * Log de auditoría para acciones importantes
     */
    public function logAudit(string $action, array $details = []): void {
        $context = array_merge([
            'user_id' => $_SESSION['usuario_id'] ?? null,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s'),
            'session_id' => session_id()
        ], $details);
        
        $logEntry = $this->formatLogEntry('AUDIT', $action, $context);
        $this->writeToFile('audit.log', $logEntry);
        
        if ($this->enableDbLogging) {
            $this->writeToDatabase('AUDIT', $action, $context);
        }
    }
    
    /**
     * Log de información general
     */
    public function logInfo(string $message, array $context = []): void {
        $logEntry = $this->formatLogEntry('INFO', $message, $context);
        $this->writeToFile('general.log', $logEntry);
    }
    
    /**
     * Log de warning
     */
    public function logWarning(string $message, array $context = []): void {
        $logEntry = $this->formatLogEntry('WARNING', $message, $context);
        $this->writeToFile('warnings.log', $logEntry);
    }
    
    /**
     * Formatear entrada de log
     */
    private function formatLogEntry(string $level, string $message, array $context = []): string {
        $timestamp = date('Y-m-d H:i:s');
        $pid = getmypid();
        $memory = memory_get_peak_usage(true);
        
        $entry = [
            'timestamp' => $timestamp,
            'level' => $level,
            'pid' => $pid,
            'memory' => $this->formatBytes($memory),
            'message' => $message,
            'context' => $context
        ];
        
        return json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
    }
    
    /**
     * Escribir a archivo
     */
    private function writeToFile(string $filename, string $content): void {
        $filepath = $this->logPath . $filename;
        
        // Rotar archivo si es muy grande (>10MB)
        if (file_exists($filepath) && filesize($filepath) > 10 * 1024 * 1024) {
            $this->rotateLogFile($filepath);
        }
        
        file_put_contents($filepath, $content, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Escribir a base de datos
     */
    private function writeToDatabase(string $level, string $message, array $context): void {
        if (!$this->database) return;
        
        try {
            $conn = $this->database->getConnection();
            
            $sql = "INSERT INTO dbo.ErrorLogs (nivel, mensaje, contexto, fecha_creacion, ip, usuario_id)
                    VALUES (?, ?, ?, SYSDATETIME(), ?, ?)";
            
            $userId = $_SESSION['usuario_id'] ?? null;
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE);
            
            $stmt = $this->database->executeQuery($sql, [
                $level,
                $message,
                $contextJson,
                $ip,
                $userId
            ]);
            
            sqlsrv_free_stmt($stmt);
            
        } catch (Exception $e) {
            // No fallar si el logging a BD falla
            error_log('Error logging to database: ' . $e->getMessage());
        }
    }
    
    /**
     * Rotar archivo de log
     */
    private function rotateLogFile(string $filepath): void {
        $rotatedPath = $filepath . '.' . date('Y-m-d_H-i-s') . '.old';
        rename($filepath, $rotatedPath);
        
        // Comprimir archivo rotado
        if (function_exists('gzopen')) {
            $this->compressFile($rotatedPath);
        }
        
        // Limpiar archivos antiguos (más de 30 días)
        $this->cleanOldLogs();
    }
    
    /**
     * Comprimir archivo
     */
    private function compressFile(string $filepath): void {
        $content = file_get_contents($filepath);
        $compressed = gzencode($content);
        file_put_contents($filepath . '.gz', $compressed);
        unlink($filepath);
    }
    
    /**
     * Limpiar logs antiguos
     */
    private function cleanOldLogs(): void {
        $files = glob($this->logPath . '*.old.gz');
        $cutoff = time() - (30 * 24 * 60 * 60); // 30 días
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
            }
        }
    }
    
    /**
     * Formatear bytes a formato legible
     */
    private function formatBytes(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB'];
        $power = floor(log($bytes, 1024));
        return round($bytes / pow(1024, $power), 2) . ' ' . $units[$power];
    }
    
    /**
     * Obtener estadísticas de logging
     */
    public function getStats(): array {
        $stats = [
            'log_directory' => $this->logPath,
            'files' => [],
            'total_size' => 0
        ];
        
        $files = glob($this->logPath . '*.log');
        foreach ($files as $file) {
            $size = filesize($file);
            $stats['files'][basename($file)] = [
                'size' => $this->formatBytes($size),
                'modified' => date('Y-m-d H:i:s', filemtime($file)),
                'lines' => $this->countLines($file)
            ];
            $stats['total_size'] += $size;
        }
        
        $stats['total_size'] = $this->formatBytes($stats['total_size']);
        
        return $stats;
    }
    
    /**
     * Contar líneas en archivo
     */
    private function countLines(string $filepath): int {
        $count = 0;
        $handle = fopen($filepath, 'r');
        if ($handle) {
            while (fgets($handle) !== false) {
                $count++;
            }
            fclose($handle);
        }
        return $count;
    }
}

// Funciones de conveniencia
function logError(string $message, array $context = []): void {
    ErrorLoggingMiddleware::getInstance()->logError($message, $context);
}

function logAudit(string $action, array $details = []): void {
    ErrorLoggingMiddleware::getInstance()->logAudit($action, $details);
}

function logInfo(string $message, array $context = []): void {
    ErrorLoggingMiddleware::getInstance()->logInfo($message, $context);
}

function logWarning(string $message, array $context = []): void {
    ErrorLoggingMiddleware::getInstance()->logWarning($message, $context);
}