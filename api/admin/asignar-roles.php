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
        getAsignaciones($conn);
        break;
    case 'POST':
        asignarRol($conn);
        break;
    case 'DELETE':
        revocarRol($conn);
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
        break;
}

function getAsignaciones($conn)
{
    try {
        // Obtener usuarios con sus roles asignados
        $sql = "SELECT 
                    u.id_usuario,
                    u.nombre,
                    u.correo,
                    u.rol as rol_sistema,
                    r.id as id_rol,
                    r.nombre as nombre_rol,
                    r.descripcion as descripcion_rol,
                    ur.fecha_asignacion
                FROM usuarios u
                LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                LEFT JOIN roles r ON ur.id_rol = r.id AND r.activo = 1
                ORDER BY u.nombre, r.nombre";

        $stmt = sqlsrv_query($conn, $sql);

        $usuarios = [];
        $usuariosMap = [];

        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $idUsuario = $row['id_usuario'];

            if (!isset($usuariosMap[$idUsuario])) {
                $usuariosMap[$idUsuario] = [
                    'id_usuario' => $row['id_usuario'],
                    'nombre' => $row['nombre'],
                    'correo' => $row['correo'],
                    'rol_sistema' => $row['rol_sistema'],
                    'roles_asignados' => []
                ];
            }

            if ($row['id_rol']) {
                $usuariosMap[$idUsuario]['roles_asignados'][] = [
                    'id_rol' => $row['id_rol'],
                    'nombre_rol' => $row['nombre_rol'],
                    'descripcion_rol' => $row['descripcion_rol'],
                    'fecha_asignacion' => $row['fecha_asignacion']
                ];
            }
        }

        $usuarios = array_values($usuariosMap);

        // Obtener todos los roles disponibles
        $sql = "SELECT id, nombre, descripcion FROM roles WHERE activo = 1 ORDER BY nombre";
        $stmt = sqlsrv_query($conn, $sql);

        $roles = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $roles[] = $row;
        }

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'usuarios' => $usuarios,
                'roles_disponibles' => $roles
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getAsignaciones: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function asignarRol($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id_usuario']) || !isset($input['id_rol'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID de usuario y rol requeridos']);
            return;
        }

        // Verificar que el usuario existe
        $sql = "SELECT nombre FROM usuarios WHERE id_usuario = ?";
        $stmt = sqlsrv_query($conn, $sql, [$input['id_usuario']]);
        $usuario = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Usuario no encontrado']);
            return;
        }

        // Verificar que el rol existe
        $sql = "SELECT nombre FROM roles WHERE id = ? AND activo = 1";
        $stmt = sqlsrv_query($conn, $sql, [$input['id_rol']]);
        $rol = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        if (!$rol) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Rol no encontrado']);
            return;
        }

        // Verificar si ya está asignado
        $sql = "SELECT COUNT(*) as count FROM usuario_roles WHERE id_usuario = ? AND id_rol = ?";
        $stmt = sqlsrv_query($conn, $sql, [$input['id_usuario'], $input['id_rol']]);
        $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        if ($result['count'] > 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'El rol ya está asignado a este usuario']);
            return;
        }

        // Asignar el rol
        $sql = "INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)";
        $stmt = sqlsrv_query($conn, $sql, [$input['id_usuario'], $input['id_rol']]);

        if ($stmt === false) {
            throw new Exception('Error al asignar rol');
        }

        echo json_encode([
            'status' => 'ok',
            'message' => "Rol '{$rol['nombre']}' asignado correctamente a {$usuario['nombre']}"
        ]);
    } catch (Exception $e) {
        error_log("Error en asignarRol: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al asignar rol']);
    }
}

function revocarRol($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id_usuario']) || !isset($input['id_rol'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID de usuario y rol requeridos']);
            return;
        }

        // Obtener información del usuario y rol para el mensaje
        $sql = "SELECT u.nombre as nombre_usuario, r.nombre as nombre_rol
                FROM usuarios u, roles r
                WHERE u.id_usuario = ? AND r.id = ?";
        $stmt = sqlsrv_query($conn, $sql, [$input['id_usuario'], $input['id_rol']]);
        $info = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        if (!$info) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Usuario o rol no encontrado']);
            return;
        }

        // Revocar el rol
        $sql = "DELETE FROM usuario_roles WHERE id_usuario = ? AND id_rol = ?";
        $stmt = sqlsrv_query($conn, $sql, [$input['id_usuario'], $input['id_rol']]);

        if ($stmt === false) {
            throw new Exception('Error al revocar rol');
        }

        echo json_encode([
            'status' => 'ok',
            'message' => "Rol '{$info['nombre_rol']}' revocado correctamente de {$info['nombre_usuario']}"
        ]);
    } catch (Exception $e) {
        error_log("Error en revocarRol: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al revocar rol']);
    }
}
