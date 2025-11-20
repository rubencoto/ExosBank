<?php

require_once __DIR__ . '/BaseException.php';

/**
 * Excepciones relacionadas con la base de datos
 */
class DatabaseException extends BaseException {
    public function __construct($message = "Error de base de datos", ?Exception $previous = null) {
        parent::__construct($message, 1000, 500, 'error', $previous);
        $this->errorCode = "DATABASE_ERROR";
    }
}

/**
 * Excepción para errores de conexión a la base de datos
 */
class DatabaseConnectionException extends BaseException {
    public function __construct($message = "Error de conexión a la base de datos", ?Exception $previous = null) {
        parent::__construct($message, 1003, 503, 'critical', $previous);
        $this->errorCode = "DB_CONNECTION_ERROR";
    }
}

/**
 * Excepción para errores de consulta SQL
 */
class SqlQueryException extends BaseException {
    public function __construct($message = "Error en consulta SQL", ?Exception $previous = null) {
        // FIXED: Using numeric code instead of string
        parent::__construct($message, 1001, 500, 'error', $previous);
        $this->errorCode = "SQL_QUERY_ERROR";
    }
}

/**
 * Excepción para violaciones de integridad referencial
 */
class DatabaseIntegrityException extends BaseException {
    public function __construct($message = "Violación de integridad en base de datos", ?Exception $previous = null) {
        parent::__construct($message, 1002, 400, 'error', $previous);
        $this->errorCode = "DB_INTEGRITY_ERROR";
    }
}