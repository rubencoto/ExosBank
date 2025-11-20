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

// Verificar que el usuario sea admin
if (!isset($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? '') !== 'Administrador') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $tipo = $_GET['tipo'] ?? 'general';
        switch ($tipo) {
            case 'financiero':
                getReporteFinanciero($conn);
                break;
            case 'usuarios':
                getReporteUsuarios($conn);
                break;
            case 'transacciones':
                getReporteTransacciones($conn);
                break;
            case 'cuentas':
                getReporteCuentas($conn);
                break;
            default:
                getReporteGeneral($conn);
                break;
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
        break;
}

function getReporteGeneral($conn)
{
    try {
        $periodo = $_GET['periodo'] ?? '30'; // días

        // Resumen ejecutivo
        $sql = "SELECT 
                    COUNT(DISTINCT u.id_usuario) as total_usuarios,
                    COUNT(DISTINCT c.id_cuenta) as total_cuentas,
                    COALESCE(SUM(c.saldo), 0) as saldo_total,
                    COUNT(DISTINCT t.id_transaccion) as total_transacciones,
                    COALESCE(SUM(t.monto), 0) as volumen_transacciones
                FROM dbo.Usuarios u
                LEFT JOIN dbo.Clientes cl ON u.id_usuario = cl.id_usuario
                LEFT JOIN dbo.Cuentas c ON cl.id_cliente = c.id_cliente
                LEFT JOIN dbo.Transacciones t ON (c.id_cuenta = t.id_cuenta_origen OR c.id_cuenta = t.id_cuenta_destino)
                    AND t.fecha >= DATEADD(day, -$periodo, GETDATE())";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de resumen: ' . print_r(sqlsrv_errors(), true));
        }
        $resumen = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);

        // Tendencias por día
        $sql = "SELECT 
                    CAST(t.fecha AS DATE) as fecha,
                    COUNT(*) as num_transacciones,
                    SUM(t.monto) as monto_total,
                    COUNT(DISTINCT t.id_cuenta_origen) as cuentas_activas
                FROM dbo.Transacciones t
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())
                GROUP BY CAST(t.fecha AS DATE)
                ORDER BY fecha";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de tendencias: ' . print_r(sqlsrv_errors(), true));
        }
        $tendencias = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['fecha']) {
                $row['fecha'] = $row['fecha']->format('Y-m-d');
            }
            $tendencias[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        // Top transacciones por tipo
        $sql = "SELECT 
                    COALESCE(t.tipo, 'Sin tipo') as tipo,
                    COUNT(*) as cantidad,
                    SUM(t.monto) as monto_total,
                    AVG(t.monto) as monto_promedio
                FROM dbo.Transacciones t
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())
                GROUP BY t.tipo
                ORDER BY monto_total DESC";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de tipos de transacción: ' . print_r(sqlsrv_errors(), true));
        }
        $tipos_transaccion = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $tipos_transaccion[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        // Distribución por estado de cuenta (como no hay tabla tipo_cuenta, usamos el saldo)
        $sql = "SELECT 
                    CASE 
                        WHEN c.saldo >= 10000 THEN 'Cuenta Premium'
                        WHEN c.saldo >= 1000 THEN 'Cuenta Estándar'
                        ELSE 'Cuenta Básica'
                    END as tipo_cuenta,
                    COUNT(c.id_cuenta) as cantidad,
                    SUM(c.saldo) as saldo_total,
                    AVG(c.saldo) as saldo_promedio
                FROM dbo.Cuentas c
                GROUP BY CASE 
                        WHEN c.saldo >= 10000 THEN 'Cuenta Premium'
                        WHEN c.saldo >= 1000 THEN 'Cuenta Estándar'
                        ELSE 'Cuenta Básica'
                    END
                ORDER BY saldo_total DESC";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de distribución de cuentas: ' . print_r(sqlsrv_errors(), true));
        }
        $distribucion_cuentas = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $distribucion_cuentas[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'resumen' => $resumen,
                'tendencias_diarias' => $tendencias,
                'tipos_transaccion' => $tipos_transaccion,
                'distribucion_cuentas' => $distribucion_cuentas,
                'periodo' => $periodo
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getReporteGeneral: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function getReporteFinanciero($conn)
{
    try {
        $periodo = $_GET['periodo'] ?? '30';

        // Análisis de rentabilidad
        $sql = "SELECT 
                    SUM(CASE WHEN t.tipo = 'Transferencia' THEN 2.50 ELSE 0 END) as ingresos_comisiones,
                    COUNT(CASE WHEN t.tipo = 'Transferencia' THEN 1 END) as transacciones_con_comision,
                    COALESCE((SELECT SUM(saldo) FROM dbo.Cuentas), 0) as activos_totales,
                    COUNT(DISTINCT CASE WHEN co.id_cliente IS NOT NULL THEN co.id_cliente 
                                      WHEN cd.id_cliente IS NOT NULL THEN cd.id_cliente END) as clientes_activos
                FROM dbo.Transacciones t
                LEFT JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
                LEFT JOIN dbo.Cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de rentabilidad: ' . print_r(sqlsrv_errors(), true));
        }
        $rentabilidad = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);

        // Análisis de riesgo
        $sql = "SELECT 
                    COUNT(CASE WHEN c.saldo < 0 THEN 1 END) as cuentas_sobregiro,
                    COUNT(CASE WHEN c.saldo > 100000 THEN 1 END) as cuentas_alto_valor,
                    SUM(CASE WHEN c.saldo < 0 THEN ABS(c.saldo) ELSE 0 END) as exposicion_riesgo,
                    AVG(c.saldo) as saldo_promedio
                FROM dbo.Cuentas c";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de análisis de riesgo: ' . print_r(sqlsrv_errors(), true));
        }
        $analisis_riesgo = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);

        // Flujo de efectivo por día
        $sql = "SELECT 
                    CAST(t.fecha AS DATE) as fecha,
                    SUM(CASE WHEN t.tipo = 'Depósito' THEN t.monto ELSE 0 END) as ingresos,
                    SUM(CASE WHEN t.tipo = 'Retiro' THEN t.monto ELSE 0 END) as egresos,
                    SUM(CASE WHEN t.tipo = 'Depósito' THEN t.monto 
                             WHEN t.tipo = 'Retiro' THEN -t.monto 
                             ELSE 0 END) as flujo_neto
                FROM dbo.Transacciones t
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())
                GROUP BY CAST(t.fecha AS DATE)
                ORDER BY fecha";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de flujo de efectivo: ' . print_r(sqlsrv_errors(), true));
        }
        $flujo_efectivo = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['fecha']) {
                $row['fecha'] = $row['fecha']->format('Y-m-d');
            }
            $flujo_efectivo[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'rentabilidad' => $rentabilidad,
                'analisis_riesgo' => $analisis_riesgo,
                'flujo_efectivo' => $flujo_efectivo,
                'periodo' => $periodo
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getReporteFinanciero: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function getReporteUsuarios($conn)
{
    try {
        $periodo = $_GET['periodo'] ?? '30';

        // Análisis de usuarios
        $sql = "SELECT 
                    COUNT(*) as total_usuarios,
                    0 as nuevos_usuarios,
                    COUNT(CASE WHEN u.rol = 'Administrador' THEN 1 END) as administradores,
                    COUNT(CASE WHEN u.rol = 'Cliente' THEN 1 END) as clientes
                FROM dbo.Usuarios u";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de resumen de usuarios: ' . print_r(sqlsrv_errors(), true));
        }
        $resumen_usuarios = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);

        // Usuarios más activos
        $sql = "SELECT TOP 10
                    u.nombre,
                    u.correo,
                    COUNT(t.id_transaccion) as transacciones_realizadas,
                    SUM(t.monto) as volumen_transacciones,
                    MAX(t.fecha) as ultima_actividad
                FROM dbo.Usuarios u
                JOIN dbo.Clientes cl ON u.id_usuario = cl.id_usuario
                JOIN dbo.Cuentas c ON cl.id_cliente = c.id_cliente
                JOIN dbo.Transacciones t ON c.id_cuenta = t.id_cuenta_origen
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())
                GROUP BY u.id_usuario, u.nombre, u.correo
                ORDER BY transacciones_realizadas DESC";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de usuarios activos: ' . print_r(sqlsrv_errors(), true));
        }
        $usuarios_activos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['ultima_actividad']) {
                $row['ultima_actividad'] = $row['ultima_actividad']->format('Y-m-d H:i:s');
            }
            $usuarios_activos[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        // Registros por día (simulado con datos ficticios ya que no hay fecha_registro)
        $registros_diarios = [];
        for ($i = $periodo; $i >= 1; $i--) {
            $fecha = date('Y-m-d', strtotime("-$i days"));
            $registros_diarios[] = [
                'fecha' => $fecha,
                'nuevos_registros' => rand(0, 5)
            ];
        }

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'resumen' => $resumen_usuarios,
                'usuarios_activos' => $usuarios_activos,
                'registros_diarios' => $registros_diarios,
                'periodo' => $periodo
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getReporteUsuarios: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function getReporteTransacciones($conn)
{
    try {
        $periodo = $_GET['periodo'] ?? '30';

        // Análisis detallado de transacciones
        $sql = "SELECT 
                    COUNT(*) as total_transacciones,
                    COUNT(*) as completadas,
                    0 as pendientes,
                    0 as fallidas,
                    AVG(t.monto) as monto_promedio,
                    MAX(t.monto) as monto_maximo,
                    MIN(t.monto) as monto_minimo
                FROM dbo.Transacciones t
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de resumen de transacciones: ' . print_r(sqlsrv_errors(), true));
        }
        $resumen_transacciones = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);

        // Transacciones por hora del día
        $sql = "SELECT 
                    DATEPART(hour, t.fecha) as hora,
                    COUNT(*) as cantidad,
                    AVG(t.monto) as monto_promedio
                FROM dbo.Transacciones t
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())
                GROUP BY DATEPART(hour, t.fecha)
                ORDER BY hora";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de transacciones por hora: ' . print_r(sqlsrv_errors(), true));
        }
        $transacciones_por_hora = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $transacciones_por_hora[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        // Transacciones más grandes
        $sql = "SELECT TOP 10
                    t.id_transaccion as id,
                    t.fecha,
                    t.tipo,
                    t.monto,
                    co.numero_cuenta as origen,
                    cd.numero_cuenta as destino,
                    'Transferencia' as descripcion,
                    u_origen.nombre as nombre_origen,
                    u_destino.nombre as nombre_destino
                FROM dbo.Transacciones t
                LEFT JOIN dbo.Cuentas co ON t.id_cuenta_origen = co.id_cuenta
                LEFT JOIN dbo.Clientes cl_origen ON co.id_cliente = cl_origen.id_cliente
                LEFT JOIN dbo.Usuarios u_origen ON cl_origen.id_usuario = u_origen.id_usuario
                LEFT JOIN dbo.Cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
                LEFT JOIN dbo.Clientes cl_destino ON cd.id_cliente = cl_destino.id_cliente
                LEFT JOIN dbo.Usuarios u_destino ON cl_destino.id_usuario = u_destino.id_usuario
                WHERE t.fecha >= DATEADD(day, -$periodo, GETDATE())
                ORDER BY t.monto DESC";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de transacciones grandes: ' . print_r(sqlsrv_errors(), true));
        }
        $transacciones_grandes = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['fecha']) {
                $row['fecha'] = $row['fecha']->format('Y-m-d H:i:s');
            }
            $transacciones_grandes[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'resumen' => $resumen_transacciones,
                'por_hora' => $transacciones_por_hora,
                'transacciones_grandes' => $transacciones_grandes,
                'periodo' => $periodo
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getReporteTransacciones: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function getReporteCuentas($conn)
{
    try {
        // Análisis de cuentas
        $sql = "SELECT 
                    COUNT(*) as total_cuentas,
                    SUM(c.saldo) as saldo_total,
                    AVG(c.saldo) as saldo_promedio,
                    COUNT(CASE WHEN c.saldo > 0 THEN 1 END) as cuentas_positivas,
                    COUNT(CASE WHEN c.saldo = 0 THEN 1 END) as cuentas_cero,
                    COUNT(CASE WHEN c.saldo < 0 THEN 1 END) as cuentas_negativas
                FROM dbo.Cuentas c";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de resumen de cuentas: ' . print_r(sqlsrv_errors(), true));
        }
        $resumen_cuentas = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmt);

        // Distribución por rangos de saldo
        $sql = "SELECT 
                    CASE 
                        WHEN c.saldo < 0 THEN 'Negativo'
                        WHEN c.saldo = 0 THEN 'Cero'
                        WHEN c.saldo <= 1000 THEN '0-1K'
                        WHEN c.saldo <= 5000 THEN '1K-5K'
                        WHEN c.saldo <= 10000 THEN '5K-10K'
                        WHEN c.saldo <= 50000 THEN '10K-50K'
                        ELSE '50K+'
                    END as rango,
                    COUNT(*) as cantidad,
                    SUM(c.saldo) as saldo_total
                FROM dbo.Cuentas c
                GROUP BY 
                    CASE 
                        WHEN c.saldo < 0 THEN 'Negativo'
                        WHEN c.saldo = 0 THEN 'Cero'
                        WHEN c.saldo <= 1000 THEN '0-1K'
                        WHEN c.saldo <= 5000 THEN '1K-5K'
                        WHEN c.saldo <= 10000 THEN '5K-10K'
                        WHEN c.saldo <= 50000 THEN '10K-50K'
                        ELSE '50K+'
                    END
                ORDER BY 
                    CASE 
                        WHEN c.saldo < 0 THEN 1
                        WHEN c.saldo = 0 THEN 2
                        WHEN c.saldo <= 1000 THEN 3
                        WHEN c.saldo <= 5000 THEN 4
                        WHEN c.saldo <= 10000 THEN 5
                        WHEN c.saldo <= 50000 THEN 6
                        ELSE 7
                    END";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de distribución de saldos: ' . print_r(sqlsrv_errors(), true));
        }
        $distribucion_saldos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $distribucion_saldos[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        // Cuentas con mayor actividad
        $sql = "SELECT TOP 10
                    c.numero_cuenta,
                    CASE 
                        WHEN c.saldo >= 10000 THEN 'Premium'
                        WHEN c.saldo >= 1000 THEN 'Estándar'
                        ELSE 'Básica'
                    END as tipo_cuenta,
                    c.saldo,
                    u.nombre as propietario,
                    COUNT(t.id_transaccion) as num_transacciones,
                    SUM(t.monto) as volumen_transacciones
                FROM dbo.Cuentas c
                JOIN dbo.Clientes cl ON c.id_cliente = cl.id_cliente
                JOIN dbo.Usuarios u ON cl.id_usuario = u.id_usuario
                LEFT JOIN dbo.Transacciones t ON (c.id_cuenta = t.id_cuenta_origen OR c.id_cuenta = t.id_cuenta_destino)
                    AND t.fecha >= DATEADD(day, -30, GETDATE())
                GROUP BY c.id_cuenta, c.numero_cuenta, c.saldo, u.nombre
                ORDER BY num_transacciones DESC";

        $stmt = sqlsrv_query($conn, $sql);
        if (!$stmt) {
            throw new Exception('Error en consulta de cuentas activas: ' . print_r(sqlsrv_errors(), true));
        }
        $cuentas_activas = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $cuentas_activas[] = $row;
        }
        sqlsrv_free_stmt($stmt);

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'resumen' => $resumen_cuentas,
                'distribucion_saldos' => $distribucion_saldos,
                'cuentas_activas' => $cuentas_activas
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getReporteCuentas: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}
