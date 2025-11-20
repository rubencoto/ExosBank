<?php

require_once __DIR__ . '/BaseException.php';

/**
 * Excepciones relacionadas con servicios externos
 */
class ServiceException extends BaseException {
    public function __construct($message = "Error en servicio", ?Exception $previous = null) {
        parent::__construct($message, 5000, 503, 'error', $previous);
        $this->errorCode = "SERVICE_ERROR";
    }
}

/**
 * Excepción para errores de email/notificación
 */
class NotificationException extends BaseException {
    public function __construct($message = "Error en notificación", ?Exception $previous = null) {
        parent::__construct($message, 5001, 500, 'warning', $previous);
        $this->errorCode = "NOTIFICATION_ERROR";
    }
}

/**
 * Excepción para errores de configuración SMTP
 */
class MailConfigException extends BaseException {
    public function __construct($message = "Error de configuración de email", ?Exception $previous = null) {
        parent::__construct($message, 5002, 500, 'error', $previous);
        $this->errorCode = "MAIL_CONFIG_ERROR";
    }
}

/**
 * Excepción para fallos de envío de email
 */
class MailSendException extends BaseException {
    public function __construct($message = "Error al enviar email", ?Exception $previous = null) {
        parent::__construct($message, "MAIL_SEND_ERROR", 500, 'warning', $previous);
    }
}

/**
 * Excepción para servicios no disponibles
 */
class ServiceUnavailableException extends BaseException {
    public function __construct($message = "Servicio no disponible", ?Exception $previous = null) {
        parent::__construct($message, "SERVICE_UNAVAILABLE", 503, 'error', $previous);
    }
}