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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
        getAuditoria($conn);
        break;
    case 'POST':
        registrarEvento($conn);
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
        break;
}

function getAuditoria($conn)
{
    try {
        // Crear tabla de auditoría si no existe
        $sql = "IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'auditoria')
                CREATE TABLE auditoria (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    id_usuario INT,
                    accion NVARCHAR(100) NOT NULL,
                    tabla_afectada NVARCHAR(50),
                    id_registro_afectado NVARCHAR(50),
                    datos_anteriores NTEXT,
                    datos_nuevos NTEXT,
                    ip_usuario NVARCHAR(45),
                    user_agent NTEXT,
                    fecha_evento DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
                )";
        sqlsrv_query($conn, $sql);

        // Parámetros de filtrado
        $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 100;
        $usuario = isset($_GET['usuario']) ? $_GET['usuario'] : null;
        $accion = isset($_GET['accion']) ? $_GET['accion'] : null;
        $fecha_desde = isset($_GET['fecha_desde']) ? $_GET['fecha_desde'] : null;
        $fecha_hasta = isset($_GET['fecha_hasta']) ? $_GET['fecha_hasta'] : null;

        // Construir query dinámicamente
        $where = [];
        $params = [];

        if ($usuario) {
            $where[] = "u.nombre LIKE ?";
            $params[] = "%$usuario%";
        }

        if ($accion) {
            $where[] = "a.accion LIKE ?";
            $params[] = "%$accion%";
        }

        if ($fecha_desde) {
            $where[] = "a.fecha_evento >= ?";
            $params[] = $fecha_desde;
        }

        if ($fecha_hasta) {
            $where[] = "a.fecha_evento <= ?";
            $params[] = $fecha_hasta . ' 23:59:59';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        // Obtener eventos de auditoría
        $sql = "SELECT TOP ($limite)
                    a.id,
                    a.accion,
                    a.tabla_afectada,
                    a.id_registro_afectado,
                    a.datos_anteriores,
                    a.datos_nuevos,
                    a.ip_usuario,
                    a.user_agent,
                    a.fecha_evento,
                    u.id_usuario,
                    u.nombre as nombre_usuario,
                    u.correo as correo_usuario
                FROM auditoria a
                LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
                $whereClause
                ORDER BY a.fecha_evento DESC";

        $stmt = sqlsrv_query($conn, $sql, $params);

        $eventos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            // Formatear fechas
            if ($row['fecha_evento']) {
                $row['fecha_evento'] = $row['fecha_evento']->format('Y-m-d H:i:s');
            }

            // Decodificar JSON si existe
            if ($row['datos_anteriores']) {
                $row['datos_anteriores'] = json_decode($row['datos_anteriores'], true);
            }
            if ($row['datos_nuevos']) {
                $row['datos_nuevos'] = json_decode($row['datos_nuevos'], true);
            }

            $eventos[] = $row;
        }

        // Obtener estadísticas
        $sql = "SELECT 
                    COUNT(*) as total_eventos,
                    COUNT(DISTINCT id_usuario) as usuarios_activos,
                    COUNT(CASE WHEN fecha_evento >= DATEADD(day, -7, GETDATE()) THEN 1 END) as eventos_ultima_semana,
                    COUNT(CASE WHEN fecha_evento >= DATEADD(day, -1, GETDATE()) THEN 1 END) as eventos_ultimo_dia
                FROM auditoria";
        $stmt = sqlsrv_query($conn, $sql);
        $estadisticas = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        // Obtener acciones más frecuentes
        $sql = "SELECT TOP 10
                    accion,
                    COUNT(*) as frecuencia
                FROM auditoria
                WHERE fecha_evento >= DATEADD(day, -30, GETDATE())
                GROUP BY accion
                ORDER BY frecuencia DESC";
        $stmt = sqlsrv_query($conn, $sql);

        $acciones_frecuentes = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $acciones_frecuentes[] = $row;
        }

        // Obtener usuarios más activos
        $sql = "SELECT TOP 10
                    u.nombre,
                    COUNT(a.id) as eventos
                FROM auditoria a
                JOIN usuarios u ON a.id_usuario = u.id_usuario
                WHERE a.fecha_evento >= DATEADD(day, -30, GETDATE())
                GROUP BY u.id_usuario, u.nombre
                ORDER BY eventos DESC";
        $stmt = sqlsrv_query($conn, $sql);

        $usuarios_activos = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $usuarios_activos[] = $row;
        }

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'eventos' => $eventos,
                'estadisticas' => $estadisticas,
                'acciones_frecuentes' => $acciones_frecuentes,
                'usuarios_activos' => $usuarios_activos
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getAuditoria: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function registrarEvento($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['accion'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Acción requerida']);
            return;
        }

        $sql = "INSERT INTO auditoria 
                (id_usuario, accion, tabla_afectada, id_registro_afectado, datos_anteriores, datos_nuevos, ip_usuario, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            isset($input['id_usuario']) ? $input['id_usuario'] : $_SESSION['user_id'],
            $input['accion'],
            isset($input['tabla_afectada']) ? $input['tabla_afectada'] : null,
            isset($input['id_registro_afectado']) ? $input['id_registro_afectado'] : null,
            isset($input['datos_anteriores']) ? json_encode($input['datos_anteriores']) : null,
            isset($input['datos_nuevos']) ? json_encode($input['datos_nuevos']) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ];

        $stmt = sqlsrv_query($conn, $sql, $params);

        if ($stmt === false) {
            throw new Exception('Error al registrar evento de auditoría');
        }

        echo json_encode([
            'status' => 'ok',
            'message' => 'Evento registrado correctamente'
        ]);
    } catch (Exception $e) {
        error_log("Error en registrarEvento: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al registrar evento']);
    }
}

// Función auxiliar para registrar eventos desde otros scripts
function registrarEventoAuditoria($conn, $accion, $tabla = null, $id_registro = null, $datos_anteriores = null, $datos_nuevos = null)
{
    try {
        $sql = "INSERT INTO auditoria 
                (id_usuario, accion, tabla_afectada, id_registro_afectado, datos_anteriores, datos_nuevos, ip_usuario, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            $_SESSION['user_id'] ?? null,
            $accion,
            $tabla,
            $id_registro,
            $datos_anteriores ? json_encode($datos_anteriores) : null,
            $datos_nuevos ? json_encode($datos_nuevos) : null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ];

        sqlsrv_query($conn, $sql, $params);
    } catch (Exception $e) {
        error_log("Error al registrar auditoría: " . $e->getMessage());
    }
}
