<?php
// Configurar sesión
require_once __DIR__ . '/../../config/session.php';
session_start();

// Configuración de headers y CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

// Verificar sesión activa
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'No hay sesión activa'
    ]);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

// Importar sistema de excepciones
require_once __DIR__ . '/../../Exceptions/ExceptionLoader.php';

try {
    $input = file_get_contents('php://input');
    if ($input === false) {
        throw new ServiceException('No se pudo leer el contenido de la solicitud');
    }

    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidJsonException('JSON inválido: ' . json_last_error_msg());
    }

    $requiredFields = ['cuenta_origen', 'cuenta_destino', 'monto'];
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        throw ExceptionFactory::createMissingFieldsException($missing);
    }

    $cuentaOrigen = trim($data['cuenta_origen']);
    $cuentaDestino = trim($data['cuenta_destino']);
    $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
    $monto = floatval($data['monto']);

    // Validaciones de negocio
    if ($cuentaOrigen === $cuentaDestino) {
        throw new TransactionException('La cuenta destino debe ser diferente a la cuenta origen');
    }

    if ($monto <= 0) {
        throw ExceptionFactory::createInvalidAmountException();
    }

    if ($monto > 100000000) {
        throw new TransactionLimitExceededException('Monto excede el límite permitido (₡100,000,000)');
    }

    if (strlen($descripcion) > 250) {
        $descripcion = substr($descripcion, 0, 250);
    }

    $userId = intval($_SESSION['usuario_id']);
    $database = new Database();
    $conn = $database->getConnection();

    if (!sqlsrv_begin_transaction($conn)) {
        $sqlErrors = sqlsrv_errors();
        $errorMsg = is_array($sqlErrors) && !empty($sqlErrors)
            ? $sqlErrors[0]['message']
            : 'Error desconocido';
        throw new DatabaseException('No se pudo iniciar la transacción: ' . $errorMsg);
    }

    try {
        // Verificar que la cuenta origen pertenece al usuario autenticado
        $sqlCuentaOrigen = "SELECT c.id_cuenta, c.numero_cuenta, c.saldo, c.tipo_cuenta
                             FROM dbo.Cuentas c
                             INNER JOIN dbo.Clientes cl ON c.id_cliente = cl.id_cliente
                             WHERE cl.id_usuario = ? AND c.numero_cuenta = ?";

        $stmtOrigen = $database->executeQuery($sqlCuentaOrigen, [$userId, $cuentaOrigen]);

        $origen = sqlsrv_fetch_array($stmtOrigen, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtOrigen);

        if (!$origen) {
            throw new AccountNotFoundException('La cuenta origen no pertenece al usuario actual');
        }

        // La verificación de estado se omite por ahora ya que no existe la columna 'estado' en la BD
        // TODO: Agregar columna 'estado' a la tabla Cuentas si se requiere esta funcionalidad

        // Verificar fondos suficientes
        if (floatval($origen['saldo']) < $monto) {
            throw ExceptionFactory::createInsufficientFundsException();
        }

        // Obtener cuenta destino (puede ser de otro usuario)
        $sqlCuentaDestino = "SELECT c.id_cuenta, c.numero_cuenta, c.saldo, c.tipo_cuenta
                              FROM dbo.Cuentas c
                              WHERE c.numero_cuenta = ?";

        $stmtDestino = $database->executeQuery($sqlCuentaDestino, [$cuentaDestino]);

        $destino = sqlsrv_fetch_array($stmtDestino, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtDestino);

        if (!$destino) {
            throw new AccountNotFoundException('La cuenta destino no existe');
        }

        // La verificación de estado se omite por ahora ya que no existe la columna 'estado' en la BD
        // TODO: Agregar columna 'estado' a la tabla Cuentas si se requiere esta funcionalidad

        // Actualizar saldo de cuenta origen
        $updateOrigen = "UPDATE dbo.Cuentas SET saldo = saldo - ? WHERE id_cuenta = ? AND saldo >= ?";
        $stmtUpdateOrigen = $database->executeQuery($updateOrigen, [$monto, $origen['id_cuenta'], $monto]);

        $rowsAffected = sqlsrv_rows_affected($stmtUpdateOrigen);
        // Actualizar saldo de cuenta destino
        $updateDestino = "UPDATE dbo.Cuentas SET saldo = saldo + ? WHERE id_cuenta = ?";
        $stmtUpdateDestino = $database->executeQuery($updateDestino, [$monto, $destino['id_cuenta']]);
        sqlsrv_free_stmt($stmtUpdateDestino);

        // Registrar transacción
        $sqlInsert = "INSERT INTO dbo.Transacciones (id_cuenta_origen, id_cuenta_destino, monto, tipo, fecha)
                      OUTPUT INSERTED.id_transaccion AS id_transaccion
                      VALUES (?, ?, ?, ?, SYSDATETIME())";

        $tipoTransaccion = 'transferencia';
        $stmtInsert = $database->executeQuery($sqlInsert, [
            $origen['id_cuenta'],
            $destino['id_cuenta'],
            $monto,
            $tipoTransaccion
        ]);

        $inserted = sqlsrv_fetch_array($stmtInsert, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtInsert);

        if (!$inserted || !isset($inserted['id_transaccion'])) {
            throw new TransactionException('No se pudo obtener el ID de la transacción registrada');
        }

        sqlsrv_commit($conn);

        // Enviar notificaciones de transferencia
        try {
            require_once __DIR__ . '/../../Services/NotificationService.php';
            $notificationService = new NotificationService();

            error_log('Iniciando envío de notificaciones para transacción: ' . $inserted['id_transaccion']);

            // Notificar al emisor (débito)
            $resultEmisor = $notificationService->notificarTransferencia($inserted['id_transaccion'], 'enviada');
            error_log('Notificación de débito enviada: ' . ($resultEmisor ? 'éxito' : 'fallo'));

            // Notificar al receptor (crédito)
            $resultReceptor = $notificationService->notificarTransferencia($inserted['id_transaccion'], 'recibida');
            error_log('Notificación de crédito enviada: ' . ($resultReceptor ? 'éxito' : 'fallo'));
        } catch (NotificationException $notifError) {
            error_log('Error enviando notificaciones de transferencia: ' . $notifError->getMessage());
            // No fallar la transferencia si las notificaciones fallan
        } catch (Exception $notifError) {
            error_log('Error inesperado en notificaciones: ' . $notifError->getMessage());
        }

        $database->closeConnection();

        echo json_encode([
            'status' => 'ok',
            'message' => 'Transferencia realizada exitosamente',
            'data' => [
                'id_transaccion' => $inserted['id_transaccion'],
                'cuenta_origen' => $origen['numero_cuenta'],
                'cuenta_destino' => $destino['numero_cuenta'],
                'monto' => round($monto, 2),
                'saldo_restante' => round(floatval($origen['saldo']) - $monto, 2)
            ]
        ]);
        exit();
    } catch (BaseException $txError) {
        sqlsrv_rollback($conn);
        $database->closeConnection();
        throw $txError;
    } catch (Exception $txError) {
        sqlsrv_rollback($conn);
        $database->closeConnection();
        throw new TransactionException('Error inesperado en transacción: ' . $txError->getMessage());
    }
} catch (BaseException $e) {
    // Las excepciones personalizadas manejan su propia respuesta HTTP
    $e->sendJsonResponse();
} catch (Exception $e) {
    error_log('Error crítico en transferir.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
