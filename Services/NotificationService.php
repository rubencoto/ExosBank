<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../Exceptions/ExceptionLoader.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class NotificationService
{
    private $mailer;
    private $database;
    private $conn;
    private $maxRetries = 3;
    private $retryDelay = 5; // segundos

    public function __construct()
    {
        try {
            $this->database = new Database();
            $this->conn = $this->database->getConnection();
            $this->initializeMailer();
        } catch (DatabaseConnectionException $e) {
            throw new NotificationException('No se pudo conectar a la base de datos para el servicio de notificaciones', $e);
        } catch (Exception $e) {
            throw new NotificationException('Error inicializando servicio de notificaciones: ' . $e->getMessage(), $e);
        }
    }

    private function initializeMailer()
    {
        try {
            $this->mailer = new PHPMailer(true);

            // Configuración del servidor SMTP
            $this->mailer->isSMTP();
            $this->mailer->Host       = 'smtp.gmail.com';
            $this->mailer->SMTPAuth   = true;
            $this->mailer->Username   = 'serviciocontactoventaonline@gmail.com';
            $this->mailer->Password   = 'hbon bfqz wroe bmzm';
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port       = 587;
            $this->mailer->CharSet    = 'UTF-8';
            $this->mailer->Timeout    = 30;

            // Configuración del remitente
            $this->mailer->setFrom(
                'serviciocontactoventaonline@gmail.com',
                'ExosBank - Sistema Bancario'
            );

            $this->mailer->SMTPDebug = 0;
        } catch (Exception $e) {
            throw new MailConfigException("Error configurando PHPMailer: " . $e->getMessage(), $e);
        }
    }

    /**
     * Enviar notificación de cuenta creada
     */
    public function notificarCuentaCreada($idCliente, $numeroCuenta, $tipoCuenta)
    {
        try {
            // Notificaciones siempre habilitadas

            // Obtener datos del cliente
            $cliente = $this->obtenerDatosCliente($idCliente);
            if (!$cliente) {
                throw new NotificationException("Cliente no encontrado para ID: $idCliente");
            }

            // Validar email del cliente
            if (!filter_var($cliente['email'], FILTER_VALIDATE_EMAIL)) {
                throw new NotificationException("Email del cliente inválido: " . $cliente['email']);
            }

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($cliente['email'], $cliente['nombre_completo']);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Nueva cuenta creada - ExosBank';

            $tipoTexto = $tipoCuenta == 1 ? 'Corriente' : 'Ahorro';

            $body = $this->getTemplate('cuenta_creada', [
                'nombre_cliente' => $cliente['nombre_completo'],
                'numero_cuenta' => $numeroCuenta,
                'tipo_cuenta' => $tipoTexto,
                'fecha' => date('d/m/Y H:i:s')
            ]);

            $this->mailer->Body = $body;

            return $this->sendEmailWithRetry();
        } catch (NotificationException $e) {
            throw $e;
        } catch (Exception $e) {
            throw new NotificationException("Error enviando notificación de cuenta creada: " . $e->getMessage(), $e);
        }
    }

    /**
     * Enviar email con reintentos automáticos
     */
    private function sendEmailWithRetry(): bool
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            $attempts++;

            try {
                $result = $this->mailer->send();
                if ($result) {
                    return true;
                }
                throw new MailSendException("PHPMailer retornó false en el envío");
            } catch (Exception $e) {
                $lastException = $e;
                error_log("Intento $attempts de envío de email falló: " . $e->getMessage());

                if ($attempts < $this->maxRetries) {
                    sleep($this->retryDelay);
                    // Reinicializar mailer para el siguiente intento
                    try {
                        $this->initializeMailer();
                    } catch (Exception $initError) {
                        error_log("Error reinicializando mailer: " . $initError->getMessage());
                    }
                }
            }
        }

        throw new MailSendException(
            "Falló el envío de email después de $this->maxRetries intentos. Último error: " .
                ($lastException ? $lastException->getMessage() : 'Error desconocido')
        );
    }

    /**
     * Enviar notificación de transferencia
     */
    public function notificarTransferencia($idTransaccion, $tipo = 'enviada')
    {
        try {
            // Validar parámetros
            if (!is_numeric($idTransaccion) || $idTransaccion <= 0) {
                throw new NotificationException("ID de transacción inválido: $idTransaccion");
            }

            if (!in_array($tipo, ['enviada', 'recibida'])) {
                throw new NotificationException("Tipo de notificación inválido: $tipo");
            }

            // Notificaciones siempre habilitadas

            // Obtener datos de la transacción
            $transaccion = $this->obtenerDatosTransaccion($idTransaccion);
            if (!$transaccion) {
                error_log("Transacción no encontrada en BD: $idTransaccion");
                throw new NotificationException("Transacción no encontrada: $idTransaccion");
            }

            error_log("Datos de transacción obtenidos: " . json_encode($transaccion));

            // Determinar si es emisor o receptor
            if ($tipo === 'enviada') {
                $cliente = $this->obtenerClientePorCuenta($transaccion['id_cuenta_origen']);
                $cuentaPropia = $transaccion['numero_cuenta_origen'];
                $cuentaOtra = $transaccion['numero_cuenta_destino'];
                $accion = 'enviado';
                $preposicion = 'a';
            } else {
                $cliente = $this->obtenerClientePorCuenta($transaccion['id_cuenta_destino']);
                $cuentaPropia = $transaccion['numero_cuenta_destino'];
                $cuentaOtra = $transaccion['numero_cuenta_origen'];
                $accion = 'recibido';
                $preposicion = 'de';
            }

            if (!$cliente) {
                error_log("Cliente no encontrado para transacción: $idTransaccion, tipo: $tipo");
                throw new NotificationException("Cliente no encontrado para la transacción: $idTransaccion");
            }

            error_log("Cliente encontrado: " . json_encode($cliente));

            // Validar email del cliente
            if (!filter_var($cliente['email'], FILTER_VALIDATE_EMAIL)) {
                error_log("Email inválido para cliente: " . $cliente['email']);
                throw new NotificationException("Email del cliente inválido: " . $cliente['email']);
            }

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($cliente['email'], $cliente['nombre_completo']);

            $this->mailer->isHTML(true);
            $this->mailer->Subject = "Transferencia {$accion} - ExosBank";

            $body = $this->getTemplate('transferencia', [
                'nombre_cliente' => $cliente['nombre_completo'],
                'accion' => $accion,
                'preposicion' => $preposicion,
                'monto' => number_format($transaccion['monto'], 2),
                'cuenta_propia' => $cuentaPropia,
                'cuenta_otra' => $cuentaOtra,
                'descripcion' => 'Transferencia bancaria',
                'fecha' => $transaccion['fecha']->format('d/m/Y H:i:s'),
                'id_transaccion' => $transaccion['id_transaccion']
            ]);

            $this->mailer->Body = $body;

            error_log("Enviando email de transferencia a: " . $cliente['email'] . " - Tipo: $tipo");
            $resultado = $this->sendEmailWithRetry();
            error_log("Resultado envío email: " . ($resultado ? 'éxito' : 'fallo'));

            return $resultado;
        } catch (NotificationException $e) {
            throw $e;
        } catch (Exception $e) {
            throw new NotificationException("Error enviando notificación de transferencia: " . $e->getMessage(), $e);
        }
    }

    /**
     * Obtener datos del cliente
     */
    private function obtenerDatosCliente($idCliente)
    {
        try {
            $query = "SELECT c.id_cliente, u.nombre as nombre_completo, 
                             u.correo as email
                      FROM dbo.Clientes c
                      INNER JOIN dbo.Usuarios u ON c.id_usuario = u.id_usuario
                      WHERE c.id_cliente = ?";

            $stmt = $this->database->executeQuery($query, [$idCliente]);
            $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            sqlsrv_free_stmt($stmt);

            return $result ?: null;
        } catch (Exception $e) {
            throw new NotificationException("Error obteniendo datos del cliente $idCliente: " . $e->getMessage(), $e);
        }
    }

    /**
     * Obtener cliente por ID de cuenta
     */
    private function obtenerClientePorCuenta($idCuenta)
    {
        try {
            $query = "SELECT c.id_cliente, u.nombre as nombre_completo, 
                             u.correo as email
                      FROM dbo.Clientes c
                      INNER JOIN dbo.Usuarios u ON c.id_usuario = u.id_usuario
                      INNER JOIN dbo.Cuentas cu ON c.id_cliente = cu.id_cliente
                      WHERE cu.id_cuenta = ?";

            $stmt = $this->database->executeQuery($query, [$idCuenta]);
            $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            sqlsrv_free_stmt($stmt);

            return $result ?: null;
        } catch (Exception $e) {
            throw new NotificationException("Error obteniendo cliente por cuenta $idCuenta: " . $e->getMessage(), $e);
        }
    }

    /**
     * Obtener datos de la transacción
     */
    private function obtenerDatosTransaccion($idTransaccion)
    {
        try {
            $query = "SELECT t.id_transaccion, t.id_cuenta_origen, t.id_cuenta_destino, 
                             t.monto, t.fecha,
                             co.numero_cuenta as numero_cuenta_origen,
                             cd.numero_cuenta as numero_cuenta_destino
                      FROM dbo.Transacciones t
                      INNER JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
                      INNER JOIN dbo.Cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
                      WHERE t.id_transaccion = ?";

            $stmt = $this->database->executeQuery($query, [$idTransaccion]);
            $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            sqlsrv_free_stmt($stmt);

            return $result ?: null;
        } catch (Exception $e) {
            throw new NotificationException("Error obteniendo datos de transacción $idTransaccion: " . $e->getMessage(), $e);
        }
    }



    /**
     * Verificar si las notificaciones están habilitadas (siempre retorna true)
     */
    private function notificacionesHabilitadas($tipo)
    {
        // Notificaciones siempre habilitadas
        return true;
    }

    /**
     * Obtener template de email
     */
    private function getTemplate($tipo, $variables)
    {
        $templates = [
            'cuenta_creada' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0B132B; margin: 0;">ExosBank</h1>
                        <p style="color: #666; margin: 5px 0;">Banco Digital</p>
                    </div>
                    
                    <h2 style="color: #0B132B; border-bottom: 2px solid #0B132B; padding-bottom: 10px;">¡Nueva Cuenta Creada!</h2>
                    
                    <p>Estimado/a <strong>{nombre_cliente}</strong>,</p>
                    
                    <p>Nos complace informarle que su nueva cuenta ha sido creada exitosamente:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Número de cuenta:</strong> {numero_cuenta}</p>
                        <p><strong>Tipo de cuenta:</strong> {tipo_cuenta}</p>
                        <p><strong>Fecha de creación:</strong> {fecha}</p>
                    </div>
                    
                    <p>Ya puede comenzar a utilizar su nueva cuenta para realizar transacciones y consultar su saldo.</p>
                    
                    <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                        <p>Este es un mensaje automático, por favor no responda a este correo.</p>
                        <p>&copy; 2024 ExosBank. Todos los derechos reservados.</p>
                    </div>
                </div>
            ',

            'transferencia' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0B132B; margin: 0;">ExosBank</h1>
                        <p style="color: #666; margin: 5px 0;">Banco Digital</p>
                    </div>
                    
                    <h2 style="color: #0B132B; border-bottom: 2px solid #0B132B; padding-bottom: 10px;">Transferencia {accion}</h2>
                    
                    <p>Estimado/a <strong>{nombre_cliente}</strong>,</p>
                    
                    <p>Le informamos que ha {accion} una transferencia:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Monto:</strong> $<span style="color: #28a745; font-size: 18px; font-weight: bold;">{monto}</span></p>
                        <p><strong>Su cuenta:</strong> {cuenta_propia}</p>
                        <p><strong>Cuenta {preposicion}:</strong> {cuenta_otra}</p>
                        <p><strong>Descripción:</strong> {descripcion}</p>
                        <p><strong>Fecha:</strong> {fecha}</p>
                        <p><strong>ID Transacción:</strong> {id_transaccion}</p>
                    </div>
                    
                    <p>La transacción se ha procesado exitosamente.</p>
                    
                    <p>Si no reconoce esta transacción, póngase en contacto con nosotros inmediatamente.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                        <p>Este es un mensaje automático, por favor no responda a este correo.</p>
                        <p>&copy; 2024 ExosBank. Todos los derechos reservados.</p>
                    </div>
                </div>
            '
        ];

        $template = $templates[$tipo] ?? '';

        // Reemplazar variables
        foreach ($variables as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }

        return $template;
    }

    public function __destruct()
    {
        if ($this->database) {
            $this->database->closeConnection();
        }
    }
}
