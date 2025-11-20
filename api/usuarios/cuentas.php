<?php
// Configurar sesión
require_once __DIR__ . '/../../config/session.php';
session_start();

// Configuración de headers y CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

// Verificar autenticación (sesión o token JWT)
$userId = null;
$userName = null;

// Primero intentar con sesión
if (isset($_SESSION['usuario_id'])) {
    $userId = $_SESSION['usuario_id'];
    $userName = $_SESSION['nombre'] ?? 'Usuario';
} else {
    // Si no hay sesión, intentar con token JWT
    require_once __DIR__ . '/../../config/jwt.php';
    $tokenData = JWTHelper::validateAuthToken();
    if ($tokenData && isset($tokenData['user_id'])) {
        $userId = $tokenData['user_id'];
        $userName = $tokenData['nombre'] ?? 'Usuario';
    }
}

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'No hay sesión activa'
    ]);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Obtener id_cliente del usuario
    $queryCliente = "SELECT id_cliente FROM dbo.Clientes WHERE id_usuario = ?";
    $stmtCliente = sqlsrv_prepare($conn, $queryCliente, array(&$userId));

    if (!$stmtCliente || !sqlsrv_execute($stmtCliente)) {
        throw new Exception('Error al obtener datos del cliente');
    }

    $cliente = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
    sqlsrv_free_stmt($stmtCliente);

    if (!$cliente) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Cliente no encontrado'
        ]);
        exit();
    }

    $clienteId = $cliente['id_cliente'];

    // Obtener cuentas bancarias del cliente
    $queryCuentas = "SELECT id_cuenta, numero_cuenta, tipo_cuenta, saldo
                     FROM dbo.Cuentas 
                     WHERE id_cliente = ?
                     ORDER BY id_cuenta DESC";

    $stmtCuentas = sqlsrv_prepare($conn, $queryCuentas, array(&$clienteId));

    if (!$stmtCuentas || !sqlsrv_execute($stmtCuentas)) {
        throw new Exception('Error al obtener cuentas');
    }

    $cuentas = [];
    while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
        // Determinar el nombre del tipo de cuenta basado en el último dígito
        $tipoCuentaNombre = '';
        switch ($cuenta['tipo_cuenta']) {
            case 1:
                $tipoCuentaNombre = 'Cuenta Corriente';
                break;
            case 2:
                $tipoCuentaNombre = 'Cuenta de Ahorro';
                break;
            default:
                $tipoCuentaNombre = 'Cuenta Bancaria';
        }

        $cuentas[] = [
            'id_cuenta' => $cuenta['id_cuenta'],
            'numero_cuenta' => $cuenta['numero_cuenta'],
            'tipo_cuenta' => $cuenta['tipo_cuenta'],
            'tipo_cuenta_nombre' => $tipoCuentaNombre,
            'saldo' => floatval($cuenta['saldo'])
        ];
    }

    sqlsrv_free_stmt($stmtCuentas);
    $database->closeConnection();

    echo json_encode([
        'status' => 'ok',
        'data' => [
            'id_cliente' => $clienteId,
            'total_cuentas' => count($cuentas),
            'cuentas' => $cuentas
        ]
    ]);
} catch (Exception $e) {
    error_log('Error en cuentas.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
