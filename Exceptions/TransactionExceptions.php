<?php

require_once __DIR__ . '/BaseException.php';

/**
 * Excepciones relacionadas con transacciones bancarias
 */
class TransactionException extends BaseException {
    public function __construct($message = "Error en transacción", ?Exception $previous = null) {
        parent::__construct($message, 3000, 400, 'error', $previous);
        $this->errorCode = "TRANSACTION_ERROR";
    }
}

/**
 * Excepción para fondos insuficientes
 */
class InsufficientFundsException extends BaseException {
    public function __construct($message = "Fondos insuficientes", ?Exception $previous = null) {
        parent::__construct($message, 3001, 400, 'warning', $previous);
        $this->errorCode = "INSUFFICIENT_FUNDS";
    }
}

/**
 * Excepción para cuenta no encontrada
 */
class AccountNotFoundException extends BaseException {
    public function __construct($message = "Cuenta no encontrada", ?Exception $previous = null) {
        parent::__construct($message, 3002, 404, 'warning', $previous);
        $this->errorCode = "ACCOUNT_NOT_FOUND";
    }
}

/**
 * Excepción para monto inválido
 */
class InvalidAmountException extends BaseException {
    public function __construct($message = "Monto inválido", ?Exception $previous = null) {
        parent::__construct($message, 3003, 400, 'warning', $previous);
        $this->errorCode = "INVALID_AMOUNT";
    }
}

/**
 * Excepción para límites de transacción excedidos
 */
class TransactionLimitExceededException extends BaseException {
    public function __construct($message = "Límite de transacción excedido", ?Exception $previous = null) {
        parent::__construct($message, 3004, 400, 'warning', $previous);
        $this->errorCode = "TRANSACTION_LIMIT_EXCEEDED";
    }
}

/**
 * Excepción para cuenta bloqueada
 */
class AccountBlockedException extends BaseException {
    public function __construct($message = "Cuenta bloqueada", ?Exception $previous = null) {
        parent::__construct($message, "ACCOUNT_BLOCKED", 403, 'warning', $previous);
    }
}