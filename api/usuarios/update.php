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
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

// Obtener datos JSON del request
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Datos inválidos'
    ]);
    exit();
}

// Validar campos requeridos
$camposRequeridos = ['nombre', 'correo', 'cedula', 'direccion', 'telefono'];
foreach ($camposRequeridos as $campo) {
    if (empty($data[$campo])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => "El campo '$campo' es obligatorio"
        ]);
        exit();
    }
}

// Validar email
if (!filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Email inválido'
    ]);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $userId = $_SESSION['usuario_id'];
    
    // Verificar si el email ya existe para otro usuario
    $queryCheck = "SELECT id_usuario FROM dbo.Usuarios WHERE correo = ? AND id_usuario != ?";
    $stmtCheck = sqlsrv_prepare($conn, $queryCheck, array(&$data['correo'], &$userId));
    
    if ($stmtCheck && sqlsrv_execute($stmtCheck)) {
        if (sqlsrv_fetch($stmtCheck)) {
            sqlsrv_free_stmt($stmtCheck);
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'El correo ya está registrado'
            ]);
            exit();
        }
        sqlsrv_free_stmt($stmtCheck);
    }
    
    // Actualizar datos en tabla Usuarios
    $queryUpdate = "UPDATE dbo.Usuarios 
                    SET nombre = ?, correo = ?, cedula = ?, direccion = ?, telefono = ?
                    WHERE id_usuario = ?";
    
    $params = array(
        $data['nombre'],
        $data['correo'],
        $data['cedula'],
        $data['direccion'],
        $data['telefono'],
        $userId
    );
    
    $stmtUpdate = sqlsrv_prepare($conn, $queryUpdate, $params);
    
    if (!$stmtUpdate || !sqlsrv_execute($stmtUpdate)) {
        throw new Exception('Error al actualizar usuario');
    }
    
    sqlsrv_free_stmt($stmtUpdate);
    
    // Actualizar datos en tabla Clientes
    $queryUpdateCliente = "UPDATE dbo.Clientes 
                           SET cedula = ?, direccion = ?, telefono = ?
                           WHERE id_usuario = ?";
    
    $paramsCliente = array(
        $data['cedula'],
        $data['direccion'],
        $data['telefono'],
        $userId
    );
    
    $stmtUpdateCliente = sqlsrv_prepare($conn, $queryUpdateCliente, $paramsCliente);
    
    if ($stmtUpdateCliente) {
        sqlsrv_execute($stmtUpdateCliente);
        sqlsrv_free_stmt($stmtUpdateCliente);
    }
    
    // Actualizar datos de sesión
    $_SESSION['nombre'] = $data['nombre'];
    $_SESSION['correo'] = $data['correo'];
    
    $database->closeConnection();
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'Perfil actualizado correctamente',
        'data' => [
            'nombre' => $data['nombre'],
            'correo' => $data['correo'],
            'cedula' => $data['cedula'],
            'direccion' => $data['direccion'],
            'telefono' => $data['telefono']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
