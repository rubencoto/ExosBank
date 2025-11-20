<?php

require_once __DIR__ . '/BaseException.php';

/**
 * Excepciones relacionadas con autenticación y autorización
 */
class AuthenticationException extends BaseException {
    public function __construct($message = "Error de autenticación", ?Exception $previous = null) {
        parent::__construct($message, 4000, 401, 'warning', $previous);
        $this->errorCode = "AUTH_ERROR";
    }
}

/**
 * Excepción para credenciales inválidas
 */
class InvalidCredentialsException extends BaseException {
    public function __construct($message = "Credenciales incorrectas", ?Exception $previous = null) {
        parent::__construct($message, 4001, 401, 'warning', $previous);
        $this->errorCode = "INVALID_CREDENTIALS";
    }
}

/**
 * Excepción para sesión expirada
 */
class SessionExpiredException extends BaseException {
    public function __construct($message = "Sesión expirada", ?Exception $previous = null) {
        parent::__construct($message, 4002, 401, 'info', $previous);
        $this->errorCode = "SESSION_EXPIRED";
    }
}

/**
 * Excepción para permisos insuficientes
 */
class InsufficientPermissionsException extends BaseException {
    public function __construct($message = "Permisos insuficientes", ?Exception $previous = null) {
        parent::__construct($message, "INSUFFICIENT_PERMISSIONS", 403, 'warning', $previous);
    }
}

/**
 * Excepción para tokens JWT inválidos
 */
class InvalidTokenException extends BaseException {
    public function __construct($message = "Token inválido", ?Exception $previous = null) {
        parent::__construct($message, "INVALID_TOKEN", 401, 'warning', $previous);
    }
}