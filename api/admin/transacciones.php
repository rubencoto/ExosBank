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
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $limit = max(1, min($limit, 500)); // Limitar entre 1 y 500 registros

    $database = new Database();
    $conn = $database->getConnection();

    $query = "SELECT TOP $limit
                t.id_transaccion,
                t.fecha,
                t.monto,
                t.tipo,
                COALESCE(co.numero_cuenta, 'Externa') AS cuenta_origen,
                COALESCE(cd.numero_cuenta, 'Externa') AS cuenta_destino,
                uo.nombre AS origen_nombre,
                ud.nombre AS destino_nombre
              FROM dbo.Transacciones t
              LEFT JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
              LEFT JOIN dbo.Clientes clo ON co.id_cliente = clo.id_cliente
              LEFT JOIN dbo.Usuarios uo ON clo.id_usuario = uo.id_usuario
              LEFT JOIN dbo.Cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
              LEFT JOIN dbo.Clientes cld ON cd.id_cliente = cld.id_cliente
              LEFT JOIN dbo.Usuarios ud ON cld.id_usuario = ud.id_usuario
              ORDER BY t.fecha DESC";

    $stmt = sqlsrv_query($conn, $query);

    if (!$stmt) {
        throw new Exception('Error al obtener transacciones');
    }

    $transacciones = [];
    $montosTotales = 0;
    $enviadas = 0;
    $recibidas = 0;

    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $montosTotales += floatval($row['monto']);

        if (!empty($row['cuenta_origen']) && $row['cuenta_origen'] !== 'Externa') {
            $enviadas++;
        }

        if (!empty($row['cuenta_destino']) && $row['cuenta_destino'] !== 'Externa') {
            $recibidas++;
        }

        $transacciones[] = [
            'id' => $row['id_transaccion'],
            'fecha' => $row['fecha'] ? $row['fecha']->format('Y-m-d H:i:s') : null,
            'tipo' => $row['tipo'],
            'descripcion' => 'Transferencia', // Campo fijo ya que no existe en la BD
            'origen' => $row['cuenta_origen'],
            'destino' => $row['cuenta_destino'],
            'monto' => floatval($row['monto']),
            'estado' => 'Completada', // Campo fijo ya que no existe en la BD
            'origen_nombre' => $row['origen_nombre'] ?: null,
            'destino_nombre' => $row['destino_nombre'] ?: null
        ];
    }

    sqlsrv_free_stmt($stmt);
    $database->closeConnection();

    echo json_encode([
        'status' => 'ok',
        'data' => [
            'total_registros' => count($transacciones),
            'monto_total' => round($montosTotales, 2),
            'enviadas_aprox' => $enviadas,
            'recibidas_aprox' => $recibidas,
            'transacciones' => $transacciones
        ]
    ]);
} catch (Exception $e) {
    error_log('Error en admin/transacciones.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
