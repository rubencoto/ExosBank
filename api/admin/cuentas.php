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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // GET - Obtener todas las cuentas
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $query = "SELECT 
                    c.id_cuenta,
                    c.numero_cuenta,
                    c.tipo_cuenta,
                    c.saldo,
                    cl.id_cliente,
                    u.id_usuario,
                    u.nombre,
                    u.correo
                  FROM dbo.Cuentas c
                  INNER JOIN dbo.Clientes cl ON c.id_cliente = cl.id_cliente
                  INNER JOIN dbo.Usuarios u ON cl.id_usuario = u.id_usuario
                  ORDER BY c.id_cuenta DESC";
        
        $stmt = sqlsrv_query($conn, $query);
        
        if (!$stmt) {
            throw new Exception('Error al obtener cuentas: ' . print_r(sqlsrv_errors(), true));
        }
        
        $cuentas = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $tipoCuentaNombre = '';
            switch ($row['tipo_cuenta']) {
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
                'id_cuenta' => $row['id_cuenta'],
                'numero_cuenta' => $row['numero_cuenta'],
                'tipo_cuenta' => $row['tipo_cuenta'],
                'tipo_cuenta_nombre' => $tipoCuentaNombre,
                'saldo' => floatval($row['saldo']),
                'cliente' => [
                    'id_cliente' => $row['id_cliente'],
                    'id_usuario' => $row['id_usuario'],
                    'nombre' => $row['nombre'],
                    'correo' => $row['correo']
                ]
            ];
        }
        
        sqlsrv_free_stmt($stmt);
        $database->closeConnection();
        
        echo json_encode([
            'status' => 'ok',
            'data' => [
                'total_cuentas' => count($cuentas),
                'cuentas' => $cuentas
            ]
        ]);
    }
    
    // DELETE - Eliminar una cuenta
    else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $idCuenta = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if ($idCuenta <= 0) {
            throw new Exception('ID de cuenta inválido');
        }
        
        // Verificar que la cuenta existe
        $queryCheck = "SELECT id_cuenta FROM dbo.Cuentas WHERE id_cuenta = ?";
        $stmtCheck = sqlsrv_prepare($conn, $queryCheck, array(&$idCuenta));
        
        if (!$stmtCheck || !sqlsrv_execute($stmtCheck)) {
            throw new Exception('Error al verificar cuenta');
        }
        
        $existe = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
        sqlsrv_free_stmt($stmtCheck);
        
        if (!$existe) {
            http_response_code(404);
            echo json_encode([
                'status' => 'error',
                'message' => 'Cuenta no encontrada'
            ]);
            exit();
        }
        
        // Eliminar la cuenta
        $queryDelete = "DELETE FROM dbo.Cuentas WHERE id_cuenta = ?";
        $stmtDelete = sqlsrv_prepare($conn, $queryDelete, array(&$idCuenta));
        
        if (!$stmtDelete || !sqlsrv_execute($stmtDelete)) {
            throw new Exception('Error al eliminar cuenta: ' . print_r(sqlsrv_errors(), true));
        }
        
        sqlsrv_free_stmt($stmtDelete);
        $database->closeConnection();
        
        echo json_encode([
            'status' => 'ok',
            'message' => 'Cuenta eliminada exitosamente'
        ]);
    }
    
    // PUT - Actualizar saldo de cuenta
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['id_cuenta']) || !isset($data['saldo'])) {
            throw new Exception('Datos incompletos');
        }
        
        $idCuenta = intval($data['id_cuenta']);
        $nuevoSaldo = floatval($data['saldo']);
        
        $queryUpdate = "UPDATE dbo.Cuentas SET saldo = ? WHERE id_cuenta = ?";
        $stmtUpdate = sqlsrv_prepare($conn, $queryUpdate, array(&$nuevoSaldo, &$idCuenta));
        
        if (!$stmtUpdate || !sqlsrv_execute($stmtUpdate)) {
            throw new Exception('Error al actualizar saldo: ' . print_r(sqlsrv_errors(), true));
        }
        
        sqlsrv_free_stmt($stmtUpdate);
        $database->closeConnection();
        
        echo json_encode([
            'status' => 'ok',
            'message' => 'Saldo actualizado exitosamente'
        ]);
    }
    
    else {
        http_response_code(405);
        echo json_encode([
            'status' => 'error',
            'message' => 'Método no permitido'
        ]);
    }
    
} catch (Exception $e) {
    error_log('Error en admin/cuentas.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
