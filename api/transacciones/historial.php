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
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
    
    // Obtener parámetros de filtrado y paginación
    $numeroCuenta = isset($_GET['numero_cuenta']) ? $_GET['numero_cuenta'] : null;
    $fechaInicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : null;
    $fechaFin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : null;
    $tipoTransaccion = isset($_GET['tipo']) ? $_GET['tipo'] : null;
    $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Obtener las cuentas del usuario con su tipo
    $queryCuentas = "SELECT c.id_cuenta, c.numero_cuenta, c.tipo_cuenta
                     FROM dbo.Clientes cl
                     INNER JOIN dbo.Cuentas c ON cl.id_cliente = c.id_cliente
                     WHERE cl.id_usuario = ?";
    
    $stmtCuentas = sqlsrv_prepare($conn, $queryCuentas, array(&$userId));
    
    if (!$stmtCuentas || !sqlsrv_execute($stmtCuentas)) {
        throw new Exception('Error al obtener cuentas del usuario');
    }
    
    $cuentasInfo = [];
    while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
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
        
        $cuentasInfo[] = [
            'numero_cuenta' => $cuenta['numero_cuenta'],
            'tipo_cuenta' => $cuenta['tipo_cuenta'],
            'tipo_cuenta_nombre' => $tipoCuentaNombre
        ];
    }
    sqlsrv_free_stmt($stmtCuentas);
    
    if (empty($cuentasInfo)) {
        echo json_encode([
            'status' => 'ok',
            'data' => [
                'cuentas' => [],
                'transacciones' => [],
                'total' => 0,
                'enviadas' => 0,
                'recibidas' => 0
            ]
        ]);
        exit();
    }
    
    // Llamar al stored procedure para obtener historial
    $sql = "{CALL dbo.sp_obtener_historial_transacciones(?, ?, ?, ?, ?, ?, ?)}";
    
    $params = array(
        array(&$userId, SQLSRV_PARAM_IN),
        array(&$numeroCuenta, SQLSRV_PARAM_IN),
        array(&$fechaInicio, SQLSRV_PARAM_IN),
        array(&$fechaFin, SQLSRV_PARAM_IN),
        array(&$tipoTransaccion, SQLSRV_PARAM_IN),
        array(&$limite, SQLSRV_PARAM_IN),
        array(&$offset, SQLSRV_PARAM_IN)
    );
    
    $stmt = sqlsrv_prepare($conn, $sql, $params);
    
    if (!$stmt || !sqlsrv_execute($stmt)) {
        throw new Exception('Error al obtener historial de transacciones');
    }
    
    $transacciones = [];
    $enviadas = 0;
    $recibidas = 0;
    
    while ($transaccion = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $esEnviada = $transaccion['direccion'] === 'Enviado';
        
        if ($esEnviada) {
            $enviadas++;
        } else {
            $recibidas++;
        }
        
        $transacciones[] = [
            'id' => $transaccion['id_transaccion'],
            'fecha' => $transaccion['fecha']->format('Y-m-d H:i:s'),
            'tipo' => $transaccion['tipo'],
            'descripcion' => 'Transferencia',
            'origen' => $transaccion['cuenta_origen'] ?? 'Externa',
            'destino' => $transaccion['cuenta_destino'] ?? 'Externa',
            'monto' => floatval($transaccion['monto']),
            'monto_neto' => floatval($transaccion['monto_neto']),
            'estado' => 'Completada',
            'es_enviada' => $esEnviada,
            'direccion' => $transaccion['direccion'],
            'cuenta_contraparte' => $transaccion['cuenta_contraparte'],
            'numero_cuenta' => $esEnviada ? $transaccion['cuenta_origen'] : $transaccion['cuenta_destino']
        ];
    }
    
    sqlsrv_free_stmt($stmt);
    $database->closeConnection();
    
    echo json_encode([
        'status' => 'ok',
        'data' => [
            'cuentas' => $cuentasInfo,
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
