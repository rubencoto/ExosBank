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
        getRoles($conn);
        break;
    case 'POST':
        createRol($conn);
        break;
    case 'PUT':
        updateRol($conn);
        break;
    case 'DELETE':
        deleteRol($conn);
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
        break;
}

function getRoles($conn)
{
    try {
        // Crear tabla de roles si no existe
        $sql = "IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'roles')
                CREATE TABLE roles (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    nombre NVARCHAR(50) UNIQUE NOT NULL,
                    descripcion NTEXT,
                    permisos NTEXT, -- JSON con permisos
                    activo BIT DEFAULT 1,
                    fecha_creacion DATETIME2 DEFAULT GETDATE(),
                    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
                )";
        sqlsrv_query($conn, $sql);

        // Crear tabla de asignación de roles si no existe
        $sql = "IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'usuario_roles')
                CREATE TABLE usuario_roles (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    id_usuario INT NOT NULL,
                    id_rol INT NOT NULL,
                    fecha_asignacion DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                    FOREIGN KEY (id_rol) REFERENCES roles(id),
                    UNIQUE(id_usuario, id_rol)
                )";
        sqlsrv_query($conn, $sql);

        // Insertar roles por defecto si no existen
        $rolesDefecto = [
            [
                'admin',
                'Administrador del sistema',
                json_encode([
                    'usuarios' => ['select' => true, 'insert' => true, 'update' => true, 'delete' => true],
                    'cuentas' => ['select' => true, 'insert' => true, 'update' => true, 'delete' => true],
                    'transacciones' => ['select' => true, 'insert' => true, 'update' => true, 'delete' => true],
                    'configuraciones' => ['select' => true, 'insert' => true, 'update' => true, 'delete' => true],
                    'reportes' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false],
                    'auditoria' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false]
                ])
            ],
            [
                'cliente',
                'Cliente del banco',
                json_encode([
                    'usuarios' => ['select' => false, 'insert' => false, 'update' => false, 'delete' => false],
                    'cuentas' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false],
                    'transacciones' => ['select' => true, 'insert' => true, 'update' => false, 'delete' => false],
                    'configuraciones' => ['select' => false, 'insert' => false, 'update' => false, 'delete' => false],
                    'reportes' => ['select' => false, 'insert' => false, 'update' => false, 'delete' => false],
                    'auditoria' => ['select' => false, 'insert' => false, 'update' => false, 'delete' => false]
                ])
            ],
            [
                'supervisor',
                'Supervisor bancario',
                json_encode([
                    'usuarios' => ['select' => true, 'insert' => false, 'update' => true, 'delete' => false],
                    'cuentas' => ['select' => true, 'insert' => true, 'update' => true, 'delete' => false],
                    'transacciones' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false],
                    'configuraciones' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false],
                    'reportes' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false],
                    'auditoria' => ['select' => true, 'insert' => false, 'update' => false, 'delete' => false]
                ])
            ]
        ];

        foreach ($rolesDefecto as $rol) {
            $sql = "IF NOT EXISTS (SELECT 1 FROM roles WHERE nombre = ?)
                    INSERT INTO roles (nombre, descripcion, permisos) VALUES (?, ?, ?)";
            $params = [$rol[0], $rol[0], $rol[1], $rol[2]];
            sqlsrv_query($conn, $sql, $params);
        }

        // Obtener todos los roles
        $sql = "SELECT id, nombre, descripcion, permisos, activo, fecha_creacion, fecha_actualizacion FROM roles WHERE activo = 1 ORDER BY nombre";
        $stmt = sqlsrv_query($conn, $sql);

        $roles = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $row['permisos'] = json_decode($row['permisos'], true);
            $roles[] = $row;
        }

        // Obtener estadísticas de asignaciones
        $sql = "SELECT r.nombre, COUNT(ur.id_usuario) as usuarios_asignados
                FROM roles r
                LEFT JOIN usuario_roles ur ON r.id = ur.id_rol
                WHERE r.activo = 1
                GROUP BY r.id, r.nombre";
        $stmt = sqlsrv_query($conn, $sql);

        $estadisticas = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $estadisticas[$row['nombre']] = $row['usuarios_asignados'];
        }

        echo json_encode([
            'status' => 'ok',
            'data' => [
                'roles' => $roles,
                'estadisticas' => $estadisticas
            ]
        ]);
    } catch (Exception $e) {
        error_log("Error en getRoles: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function createRol($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['nombre']) || !isset($input['descripcion']) || !isset($input['permisos'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Datos incompletos']);
            return;
        }

        $sql = "INSERT INTO roles (nombre, descripcion, permisos) VALUES (?, ?, ?)";
        $params = [
            $input['nombre'],
            $input['descripcion'],
            json_encode($input['permisos'])
        ];

        $stmt = sqlsrv_query($conn, $sql, $params);

        if ($stmt === false) {
            throw new Exception('Error al crear rol');
        }

        echo json_encode([
            'status' => 'ok',
            'message' => 'Rol creado correctamente'
        ]);
    } catch (Exception $e) {
        error_log("Error en createRol: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al crear rol']);
    }
}

function updateRol($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id']) || !isset($input['nombre']) || !isset($input['descripcion']) || !isset($input['permisos'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Datos incompletos']);
            return;
        }

        $sql = "UPDATE roles SET nombre = ?, descripcion = ?, permisos = ?, fecha_actualizacion = GETDATE() WHERE id = ?";
        $params = [
            $input['nombre'],
            $input['descripcion'],
            json_encode($input['permisos']),
            $input['id']
        ];

        $stmt = sqlsrv_query($conn, $sql, $params);

        if ($stmt === false) {
            throw new Exception('Error al actualizar rol');
        }

        echo json_encode([
            'status' => 'ok',
            'message' => 'Rol actualizado correctamente'
        ]);
    } catch (Exception $e) {
        error_log("Error en updateRol: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al actualizar rol']);
    }
}

function deleteRol($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID de rol requerido']);
            return;
        }

        // Verificar que no sea un rol del sistema
        $sql = "SELECT nombre FROM roles WHERE id = ?";
        $stmt = sqlsrv_query($conn, $sql, [$input['id']]);
        $rol = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

        if ($rol && in_array($rol['nombre'], ['admin', 'cliente'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No se puede eliminar un rol del sistema']);
            return;
        }

        // Marcar como inactivo en lugar de eliminar
        $sql = "UPDATE roles SET activo = 0, fecha_actualizacion = GETDATE() WHERE id = ?";
        $stmt = sqlsrv_query($conn, $sql, [$input['id']]);

        if ($stmt === false) {
            throw new Exception('Error al eliminar rol');
        }

        echo json_encode([
            'status' => 'ok',
            'message' => 'Rol eliminado correctamente'
        ]);
    } catch (Exception $e) {
        error_log("Error en deleteRol: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al eliminar rol']);
    }
}
