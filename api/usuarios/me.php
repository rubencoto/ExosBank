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
    
    // Obtener datos del usuario
    $query = "SELECT id_usuario, nombre, correo, rol, cedula, direccion, telefono, tipo_cuenta 
              FROM dbo.Usuarios 
              WHERE id_usuario = ?";
    
    $stmt = sqlsrv_prepare($conn, $query, array(&$userId));
    
    if (!$stmt || !sqlsrv_execute($stmt)) {
        throw new Exception('Error al obtener datos del usuario');
    }
    
    $usuario = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    sqlsrv_free_stmt($stmt);
    
    if (!$usuario) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Usuario no encontrado'
        ]);
        exit();
    }
    
    // Obtener id_cliente del usuario
    $queryCliente = "SELECT id_cliente FROM dbo.Clientes WHERE id_usuario = ?";
    $stmtCliente = sqlsrv_prepare($conn, $queryCliente, array(&$userId));
    
    if (!$stmtCliente || !sqlsrv_execute($stmtCliente)) {
        throw new Exception('Error al obtener datos del cliente');
    }
    
    $cliente = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
    sqlsrv_free_stmt($stmtCliente);
    
    $clienteId = $cliente ? $cliente['id_cliente'] : null;
    
    // Obtener cuentas bancarias del usuario
    $cuentas = [];
    
    if ($clienteId) {
        $queryCuentas = "SELECT id_cuenta, numero_cuenta, tipo_cuenta, saldo 
                         FROM dbo.Cuentas 
                         WHERE id_cliente = ?";
        
        $stmtCuentas = sqlsrv_prepare($conn, $queryCuentas, array(&$clienteId));
    
        if ($stmtCuentas && sqlsrv_execute($stmtCuentas)) {
            while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
                $cuentas[] = $cuenta;
            }
            sqlsrv_free_stmt($stmtCuentas);
        }
    }
    
    $database->closeConnection();
    
    echo json_encode([
        'status' => 'ok',
        'data' => [
            'id' => $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'correo' => $usuario['correo'],
            'rol' => $usuario['rol'],
            'cedula' => $usuario['cedula'],
            'direccion' => $usuario['direccion'],
            'telefono' => $usuario['telefono'],
            'tipo_cuenta' => $usuario['tipo_cuenta'],
            'cuentas' => $cuentas
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
