<?php

require_once __DIR__ . '/BaseException.php';

/**
 * Excepciones de validación de datos
 */
class ValidationException extends BaseException {
    protected $validationErrors = [];
    
    public function __construct($message = "Error de validación", $validationErrors = [], ?Exception $previous = null) {
        $this->validationErrors = $validationErrors;
        parent::__construct($message, 2000, 422, 'warning', $previous);
        $this->errorCode = "VALIDATION_ERROR";
    }
    
    /**
     * Obtener errores de validación específicos
     */
    public function getValidationErrors(): array {
        return $this->validationErrors;
    }
    
    /**
     * Agregar un error de validación
     */
    public function addValidationError(string $field, string $error): void {
        $this->validationErrors[$field][] = $error;
    }
    
    /**
     * Convertir a respuesta JSON incluyendo errores de validación
     */
    public function toJsonResponse(): array {
        $response = parent::toJsonResponse();
        if (!empty($this->validationErrors)) {
            $response['validation_errors'] = $this->validationErrors;
        }
        return $response;
    }
}

/**
 * Excepción para campos requeridos faltantes
 */
class MissingFieldsException extends ValidationException {
    public function __construct($missingFields = [], ?Exception $previous = null) {
        $message = "Campos requeridos faltantes: " . implode(', ', $missingFields);
        $validationErrors = [];
        foreach ($missingFields as $field) {
            $validationErrors[$field][] = 'Este campo es requerido';
        }
        parent::__construct($message, $validationErrors, $previous);
    }
}

/**
 * Excepción para formato JSON inválido
 */
class InvalidJsonException extends BaseException {
    public function __construct($message = "JSON inválido", ?Exception $previous = null) {
        parent::__construct($message, 2001, 400, 'warning', $previous);
        $this->errorCode = "INVALID_JSON";
    }
}

/**
 * Excepción para email inválido 
 */
class InvalidEmailException extends ValidationException {
    public function __construct($message = "Email inválido", ?Exception $previous = null) {
        parent::__construct($message, ['email' => ['Formato de email inválido']], $previous);
    }
}