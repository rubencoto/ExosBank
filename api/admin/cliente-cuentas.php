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

// Verificar sesión activa y rol de administrador
if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['rol'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'No hay sesión activa'
    ]);
    exit();
}

if ($_SESSION['rol'] !== 'Administrador') {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'No tienes permisos para acceder a este recurso'
    ]);
    exit();
}

// Validar método GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

try {
    $idUsuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;
    
    if ($idUsuario <= 0) {
        throw new Exception('ID de usuario inválido');
    }
    
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verificar que el usuario existe
    $queryUsuario = "SELECT id_usuario, nombre, correo FROM dbo.Usuarios WHERE id_usuario = ?";
    $stmtUsuario = sqlsrv_prepare($conn, $queryUsuario, array(&$idUsuario));
    
    if (!$stmtUsuario || !sqlsrv_execute($stmtUsuario)) {
        throw new Exception('Error al verificar usuario');
    }
    
    $usuario = sqlsrv_fetch_array($stmtUsuario, SQLSRV_FETCH_ASSOC);
    sqlsrv_free_stmt($stmtUsuario);
    
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
    $stmtCliente = sqlsrv_prepare($conn, $queryCliente, array(&$idUsuario));
    
    if (!$stmtCliente || !sqlsrv_execute($stmtCliente)) {
        throw new Exception('Error al obtener datos del cliente');
    }
    
    $cliente = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
    sqlsrv_free_stmt($stmtCliente);
    
    $cuentas = [];
    
    if ($cliente) {
        $idCliente = $cliente['id_cliente'];
        
        // Obtener cuentas del cliente
        $queryCuentas = "SELECT id_cuenta, numero_cuenta, tipo_cuenta, saldo
                         FROM dbo.Cuentas 
                         WHERE id_cliente = ?
                         ORDER BY id_cuenta DESC";
        
        $stmtCuentas = sqlsrv_prepare($conn, $queryCuentas, array(&$idCliente));
        
        if ($stmtCuentas && sqlsrv_execute($stmtCuentas)) {
            while ($cuenta = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
                $tipoCuentaNombre = '';
                switch ($cuenta['tipo_cuenta']) {
                    case 1:
                        $tipoCuentaNombre = 'Corriente';
                        break;
                    case 2:
                        $tipoCuentaNombre = 'Ahorro';
                        break;
                    default:
                        $tipoCuentaNombre = 'Desconocido';
                }
                
                $cuentas[] = [
                    'id_cuenta' => $cuenta['id_cuenta'],
                    'numero_cuenta' => $cuenta['numero_cuenta'],
                    'tipo_cuenta' => $cuenta['tipo_cuenta'],
                    'tipo_cuenta_nombre' => $tipoCuentaNombre,
                    'saldo' => floatval($cuenta['saldo'])
                ];
            }
            sqlsrv_free_stmt($stmtCuentas);
        }
    }
    
    $database->closeConnection();
    
    echo json_encode([
        'status' => 'ok',
        'data' => [
            'usuario' => [
                'id_usuario' => $usuario['id_usuario'],
                'nombre' => $usuario['nombre'],
                'correo' => $usuario['correo']
            ],
            'total_cuentas' => count($cuentas),
            'cuentas' => $cuentas
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Error en admin/cliente-cuentas.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
