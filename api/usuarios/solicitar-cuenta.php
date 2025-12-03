<?php
// Configurar sesión para validar cliente autenticado
require_once __DIR__ . '/../../config/session.php';
session_start();

// Configuración de headers y CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit();
}

// Verificar autenticación
$userId = null;

if (isset($_SESSION['usuario_id'])) {
    $userId = $_SESSION['usuario_id'];
} else {
    require_once __DIR__ . '/../../config/jwt.php';
    $tokenData = JWTHelper::validateAuthToken();
    if ($tokenData && isset($tokenData['user_id'])) {
        $userId = $tokenData['user_id'];
    }
}

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión para solicitar una cuenta.'
    ]);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../Exceptions/ExceptionLoader.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'JSON inválido.']);
        exit();
    }

    // Validar tipo de cuenta
    if (!isset($data['tipo_cuenta']) || !in_array($data['tipo_cuenta'], [1, 2])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tipo de cuenta inválido. Debe ser 1 (Corriente) o 2 (Ahorro).']);
        exit();
    }

    $tipo_cuenta = (int)$data['tipo_cuenta'];

    $database = new Database();
    $conn = $database->getConnection();

    if (!$conn) {
        throw new DatabaseConnectionException('No se pudo conectar a la base de datos.');
    }

    // Iniciar transacción
    sqlsrv_begin_transaction($conn);

    try {
        // Obtener el ID del cliente asociado al usuario
        $queryCliente = "SELECT id_cliente, id_usuario FROM dbo.Clientes WHERE id_usuario = ?";
        $stmtCliente = $database->executeQuery($queryCliente, [$userId]);

        if (!$stmtCliente) {
            throw new DatabaseQueryException('Error al buscar información del cliente.');
        }

        $cliente = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtCliente);

        if (!$cliente) {
            throw new NotFoundException('No se encontró información del cliente.');
        }

        $idCliente = $cliente['id_cliente'];

        // Generar número de cuenta único (11 dígitos)
        $numeroCuenta = '';
        $intentos = 0;
        $maxIntentos = 10;

        do {
            // Generar 10 dígitos aleatorios + 1 dígito del tipo de cuenta
            $numeroCuenta = str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT) . $tipo_cuenta;

            // Verificar que no exista
            $queryVerificar = "SELECT COUNT(*) as total FROM dbo.Cuentas WHERE numero_cuenta = ?";
            $stmtVerificar = $database->executeQuery($queryVerificar, [$numeroCuenta]);
            $existe = sqlsrv_fetch_array($stmtVerificar, SQLSRV_FETCH_ASSOC);
            sqlsrv_free_stmt($stmtVerificar);

            $intentos++;
        } while ($existe['total'] > 0 && $intentos < $maxIntentos);

        if ($intentos >= $maxIntentos) {
            throw new Exception('No se pudo generar un número de cuenta único. Intenta nuevamente.');
        }

        // Crear la nueva cuenta con saldo inicial de 0
        $saldoInicial = 0.00;
        $queryInsert = "INSERT INTO dbo.Cuentas (id_cliente, numero_cuenta, saldo, tipo_cuenta) 
                        OUTPUT INSERTED.id_cuenta, INSERTED.numero_cuenta, INSERTED.saldo
                        VALUES (?, ?, ?, ?)";

        $paramsInsert = [$idCliente, $numeroCuenta, $saldoInicial, $tipo_cuenta];
        $stmtInsert = $database->executeQuery($queryInsert, $paramsInsert);

        if (!$stmtInsert) {
            throw new DatabaseQueryException('Error al crear la cuenta.');
        }

        $nuevaCuenta = sqlsrv_fetch_array($stmtInsert, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtInsert);

        if (!$nuevaCuenta) {
            throw new DatabaseQueryException('No se pudo obtener la información de la cuenta creada.');
        }

        // Registrar en auditoría
        $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $queryAuditoria = "INSERT INTO dbo.Auditoria (id_usuario, accion, tabla_afectada, id_registro_afectado, 
                           datos_nuevos, ip_usuario, user_agent, fecha_evento)
                           VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE())";
        $datosNuevos = json_encode([
            'numero_cuenta' => $numeroCuenta,
            'tipo_cuenta' => $tipo_cuenta == 1 ? 'Corriente' : 'Ahorro',
            'saldo' => $saldoInicial
        ]);
        $paramsAuditoria = [$userId, 'INSERT', 'Cuentas', $nuevaCuenta['id_cuenta'], $datosNuevos, $clientIP, $userAgent];
        $stmtAuditoria = $database->executeQuery($queryAuditoria, $paramsAuditoria);
        if ($stmtAuditoria) {
            sqlsrv_free_stmt($stmtAuditoria);
        }

        // Confirmar transacción
        sqlsrv_commit($conn);

        // Enviar notificación por correo
        try {
            require_once __DIR__ . '/../../Services/NotificationService.php';
            $notificationService = new NotificationService();
            $notificationService->notificarCuentaCreada($idCliente, $numeroCuenta, $tipo_cuenta);
        } catch (Exception $emailError) {
            // Log del error pero no fallar la operación
            error_log("Error al enviar notificación de cuenta: " . $emailError->getMessage());
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Cuenta creada exitosamente.',
            'data' => [
                'id_cuenta' => $nuevaCuenta['id_cuenta'],
                'numero_cuenta' => $numeroCuenta,
                'tipo_cuenta' => $tipo_cuenta,
                'saldo' => $saldoInicial
            ]
        ]);

    } catch (Exception $e) {
        // Revertir transacción en caso de error
        sqlsrv_rollback($conn);
        throw $e;
    } finally {
        $database->closeConnection();
    }

} catch (DatabaseConnectionException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Error de conexión con la base de datos: ' . $e->getMessage()]);
} catch (NotFoundException $e) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (DatabaseQueryException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la operación: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error inesperado: ' . $e->getMessage()]);
}
