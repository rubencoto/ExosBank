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

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $userId = $_SESSION['usuario_id'];
    
    // Obtener las cuentas del usuario
    $queryCuentas = "SELECT c.id_cuenta, c.numero_cuenta 
                     FROM dbo.Clientes cl
                     INNER JOIN dbo.Cuentas c ON cl.id_cliente = c.id_cliente
                     WHERE cl.id_usuario = ?";
    
    $stmtCuentas = sqlsrv_prepare($conn, $queryCuentas, array(&$userId));
    
    if (!$stmtCuentas || !sqlsrv_execute($stmtCuentas)) {
        throw new Exception('Error al obtener cuentas del usuario');
    }
    
    $cuentasUsuario = [];
    while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
        $cuentasUsuario[] = $cuenta['id_cuenta'];
    }
    sqlsrv_free_stmt($stmtCuentas);
    
    if (empty($cuentasUsuario)) {
        echo json_encode([
            'status' => 'ok',
            'data' => [
                'transacciones' => [],
                'total' => 0,
                'enviadas' => 0,
                'recibidas' => 0
            ]
        ]);
        exit();
    }
    
    // Crear placeholders para la consulta IN
    $placeholders = implode(',', array_fill(0, count($cuentasUsuario), '?'));
    
    // Obtener transacciones donde el usuario es origen o destino
    $queryTransacciones = "SELECT 
                            t.id_transaccion,
                            t.id_cuenta_origen,
                            t.id_cuenta_destino,
                            t.monto,
                            t.tipo_transaccion,
                            t.descripcion,
                            t.fecha,
                            t.estado,
                            co.numero_cuenta as cuenta_origen,
                            cd.numero_cuenta as cuenta_destino
                          FROM dbo.Transacciones t
                          LEFT JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
                          LEFT JOIN dbo.Cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
                          WHERE t.id_cuenta_origen IN ($placeholders) 
                             OR t.id_cuenta_destino IN ($placeholders)
                          ORDER BY t.fecha DESC";
    
    $params = array_merge($cuentasUsuario, $cuentasUsuario);
    $stmtTransacciones = sqlsrv_prepare($conn, $queryTransacciones, $params);
    
    if (!$stmtTransacciones || !sqlsrv_execute($stmtTransacciones)) {
        throw new Exception('Error al obtener transacciones');
    }
    
    $transacciones = [];
    $enviadas = 0;
    $recibidas = 0;
    
    while ($transaccion = sqlsrv_fetch_array($stmtTransacciones, SQLSRV_FETCH_ASSOC)) {
        // Determinar si es enviada o recibida
        $esEnviada = in_array($transaccion['id_cuenta_origen'], $cuentasUsuario);
        
        if ($esEnviada) {
            $enviadas++;
        } else {
            $recibidas++;
        }
        
        $transacciones[] = [
            'id' => $transaccion['id_transaccion'],
            'fecha' => $transaccion['fecha']->format('Y-m-d H:i:s'),
            'tipo' => $transaccion['tipo_transaccion'],
            'descripcion' => $transaccion['descripcion'],
            'origen' => $transaccion['cuenta_origen'] ?? 'Externa',
            'destino' => $transaccion['cuenta_destino'] ?? 'Externa',
            'monto' => floatval($transaccion['monto']),
            'estado' => $transaccion['estado'],
            'es_enviada' => $esEnviada
        ];
    }
    
    sqlsrv_free_stmt($stmtTransacciones);
    $database->closeConnection();
    
    echo json_encode([
        'status' => 'ok',
        'data' => [
            'transacciones' => $transacciones,
            'total' => count($transacciones),
            'enviadas' => $enviadas,
            'recibidas' => $recibidas
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
