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
        // Llamar al procedimiento almacenado
        $sql = "{CALL dbo.sp_crear_cuenta_bancaria(?, ?, ?, ?, ?, ?, ?, ?)}";
        
        $resultado = 0;
        $mensaje = '';
        $resultado = 0;
        $mensaje = '';
        $idCuenta = 0;
        $numeroCuenta = '';
        $idCliente = 0;
        
        $params = [
            $userId,
            $tipo_cuenta,
            0.00, // saldo inicial
            $clientIP,
            $userAgent,
            array(&$resultado, SQLSRV_PARAM_OUT),
            array(&$mensaje, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
            array(&$idCuenta, SQLSRV_PARAM_OUT),
            array(&$numeroCuenta, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
            array(&$idCliente, SQLSRV_PARAM_OUT)
        ];
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        
        if (!$stmt) {
            $errors = sqlsrv_errors();
            $errorMsg = is_array($errors) && !empty($errors) ? $errors[0]['message'] : 'Error desconocido';
            throw new DatabaseQueryException('Error ejecutando procedimiento almacenado: ' . $errorMsg);
        }
        
        // Procesar todos los result sets para que los OUTPUT params se llenen
        while (sqlsrv_next_result($stmt) !== null) {
            // Continuar procesando hasta que no haya más result sets
        }
        
        // Los valores de salida ya están en las variables por referencia
        // $resultado, $mensaje, $idCuenta, $numeroCuenta, $idCliente ya tienen los valores
        
        sqlsrv_free_stmt($stmt);
        
        // Verificar resultado
        if ($resultado !== 0) {
            throw new DatabaseQueryException($mensaje);
        }

        // Confirmar transacción
        sqlsrv_commit($conn);

        // Enviar notificación por correo
        try {
            if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
                require_once __DIR__ . '/../../Services/NotificationService.php';
                $notificationService = new NotificationService();
                $notificationService->notificarCuentaCreada($idCliente, $numeroCuenta, $tipo_cuenta);
            }
        } catch (Exception $emailError) {
            // Log del error pero no fallar la operación
            error_log("Error al enviar notificación de cuenta: " . $emailError->getMessage());
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => $mensaje,
            'data' => [
                'id_cuenta' => $idCuenta,
                'numero_cuenta' => $numeroCuenta,
                'tipo_cuenta' => $tipo_cuenta,
                'saldo' => 0.00
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
