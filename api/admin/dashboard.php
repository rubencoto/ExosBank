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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

if (!isset($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? '') !== 'Administrador') {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'No tienes permisos para acceder a este recurso'
    ]);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    $totals = [
        'usuarios' => 0,
        'clientes' => 0,
        'cuentas' => 0,
        'cuentas_saldo_total' => 0.0,
        'transacciones' => 0,
        'transacciones_monto_total' => 0.0
    ];

    // Totales básicos
    $queries = [
        'usuarios' => "SELECT COUNT(*) as total FROM dbo.Usuarios",
        'clientes' => "SELECT COUNT(*) as total FROM dbo.Usuarios WHERE rol = 'Cliente'",
        'cuentas' => "SELECT COUNT(*) as total, COALESCE(SUM(CAST(saldo AS FLOAT)), 0) as saldo FROM dbo.Cuentas",
        'transacciones' => "SELECT COUNT(*) as total, COALESCE(SUM(CAST(monto AS FLOAT)), 0) as monto FROM dbo.Transacciones"
    ];

    // Usuarios
    $stmt = $database->executeQuery($queries['usuarios']);
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    $totals['usuarios'] = intval($row['total'] ?? 0);
    sqlsrv_free_stmt($stmt);

    // Clientes
    $stmt = $database->executeQuery($queries['clientes']);
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    $totals['clientes'] = intval($row['total'] ?? 0);
    sqlsrv_free_stmt($stmt);

    // Cuentas
    $stmt = $database->executeQuery($queries['cuentas']);
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    $totals['cuentas'] = intval($row['total'] ?? 0);
    $totals['cuentas_saldo_total'] = round(floatval($row['saldo'] ?? 0), 2);
    sqlsrv_free_stmt($stmt);

    // Transacciones
    $stmt = $database->executeQuery($queries['transacciones']);
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    $totals['transacciones'] = intval($row['total'] ?? 0);
    $totals['transacciones_monto_total'] = round(floatval($row['monto'] ?? 0), 2);
    sqlsrv_free_stmt($stmt);

    // Distribución por tipo de cuenta
    $accountTypes = [];
    $queryTypes = "SELECT tipo_cuenta, COUNT(*) as total FROM dbo.Cuentas GROUP BY tipo_cuenta";
    $stmtTypes = $database->executeQuery($queryTypes);
    while ($row = sqlsrv_fetch_array($stmtTypes, SQLSRV_FETCH_ASSOC)) {
        $accountTypes[] = [
            'tipo_cuenta' => intval($row['tipo_cuenta']),
            'nombre' => match (intval($row['tipo_cuenta'])) {
                1 => 'Corriente',
                2 => 'Ahorro',
                3 => 'Crédito',
                default => 'Cuenta'
            },
            'total' => intval($row['total'])
        ];
    }
    sqlsrv_free_stmt($stmtTypes);

    // Actividad diaria últimos 7 días
    $dailyActivity = [];
    $queryDaily = "SELECT TOP 7 CONVERT(date, fecha) as dia, COUNT(*) as total, COALESCE(SUM(CAST(monto AS FLOAT)), 0) as monto
                   FROM dbo.Transacciones
                   GROUP BY CONVERT(date, fecha)
                   ORDER BY dia DESC";
    $stmtDaily = $database->executeQuery($queryDaily);
    while ($row = sqlsrv_fetch_array($stmtDaily, SQLSRV_FETCH_ASSOC)) {
        $dailyActivity[] = [
            'fecha' => $row['dia']->format('Y-m-d'),
            'transacciones' => intval($row['total']),
            'monto' => round(floatval($row['monto']), 2)
        ];
    }
    sqlsrv_free_stmt($stmtDaily);
    $dailyActivity = array_reverse($dailyActivity); // Mostrar del más antiguo al más reciente

    // Últimas transacciones
    $recentTransactions = [];
    $queryRecent = "SELECT TOP 5
                        t.id_transaccion,
                        t.fecha,
                        t.monto,
                        t.tipo,
                        COALESCE(co.numero_cuenta, 'Externa') AS origen,
                        COALESCE(cd.numero_cuenta, 'Externa') AS destino
                    FROM dbo.Transacciones t
                    LEFT JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
                    LEFT JOIN dbo.Cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
                    ORDER BY t.fecha DESC";
    $stmtRecent = $database->executeQuery($queryRecent);
    while ($row = sqlsrv_fetch_array($stmtRecent, SQLSRV_FETCH_ASSOC)) {
        $recentTransactions[] = [
            'id' => $row['id_transaccion'],
            'fecha' => $row['fecha'] ? $row['fecha']->format('Y-m-d H:i:s') : null,
            'tipo' => $row['tipo'],
            'descripcion' => 'Transferencia', // Campo fijo ya que no existe en la BD
            'origen' => $row['origen'],
            'destino' => $row['destino'],
            'monto' => round(floatval($row['monto']), 2),
            'estado' => 'Completada' // Campo fijo ya que no existe en la BD
        ];
    }
    sqlsrv_free_stmt($stmtRecent);

    $database->closeConnection();

    echo json_encode([
        'status' => 'ok',
        'data' => [
            'totals' => $totals,
            'account_types' => $accountTypes,
            'daily_activity' => $dailyActivity,
            'recent_transactions' => $recentTransactions
        ]
    ]);
} catch (BaseException $e) {
    $e->sendJsonResponse();
} catch (Exception $e) {
    error_log('Error crítico en admin/dashboard.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
