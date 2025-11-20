<?php

/**
 * Excepción base para el sistema ExosBank
 */
abstract class BaseException extends Exception {
    protected $errorCode;
    protected $httpStatusCode;
    protected $logLevel;
    
    public function __construct($message = "", $errorCode = 0, $httpStatusCode = 500, $logLevel = 'error', ?Exception $previous = null) {
        parent::__construct($message, $errorCode, $previous);
        $this->errorCode = $errorCode;
        $this->httpStatusCode = $httpStatusCode;
        $this->logLevel = $logLevel;
        
        // Log automático del error
        $this->logError();
    }
    
    /**
     * Obtener el código HTTP apropiado
     */
    public function getHttpStatusCode(): int {
        return $this->httpStatusCode;
    }
    
    /**
     * Obtener el código de error personalizado
     */
    public function getErrorCode() {
        return $this->errorCode;
    }
    
    /**
     * Obtener el nivel de log
     */
    public function getLogLevel(): string {
        return $this->logLevel;
    }
    
    /**
     * Logging automático del error
     */
    protected function logError(): void {
        $errorInfo = [
            'exception' => get_class($this),
            'message' => $this->getMessage(),
            'code' => $this->getErrorCode(),
            'file' => $this->getFile(),
            'line' => $this->getLine(),
            'trace' => $this->getTraceAsString(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        error_log(sprintf(
            "[%s] %s: %s in %s:%d\nStack trace:\n%s",
            strtoupper($this->logLevel),
            get_class($this),
            $this->getMessage(),
            $this->getFile(),
            $this->getLine(),
            $this->getTraceAsString()
        ));
    }
    
    /**
     * Convertir la excepción a respuesta JSON para APIs
     */
    public function toJsonResponse(): array {
        return [
            'status' => 'error',
            'message' => $this->getMessage(),
            'error_code' => $this->getErrorCode(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Enviar respuesta HTTP JSON y terminar ejecución
     */
    public function sendJsonResponse(): void {
        http_response_code($this->getHttpStatusCode());
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($this->toJsonResponse());
        exit();
    }
}