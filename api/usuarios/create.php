<?php
// Configuración de headers y CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'JSON inválido.']);
        exit();
    }
    
    $camposRequeridos = ['nombre', 'correo', 'contrasena', 'rol', 'telefono', 'cedula', 'direccion'];
    $camposFaltantes = [];
    
    foreach ($camposRequeridos as $campo) {
        if (!isset($data[$campo]) || trim($data[$campo]) === '') {
            $camposFaltantes[] = $campo;
        }
    }
    
    if (!empty($camposFaltantes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Campos obligatorios faltantes: ' . implode(', ', $camposFaltantes)]);
        exit();
    }
    
    $nombre = trim($data['nombre']);
    $correo = trim($data['correo']);
    $contrasena = $data['contrasena'];
    $rol = trim($data['rol']);
    $telefono = trim($data['telefono']);
    $cedula = trim($data['cedula']);
    $direccion = trim($data['direccion']);
    
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Formato de correo inválido.']);
        exit();
    }
    
    if (!in_array($rol, ['Administrador', 'Cliente'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Rol inválido.']);
        exit();
    }
    
    if (strlen($contrasena) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
        exit();
    }
    
    $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);
    
    $database = new Database();
    $conn = $database->getConnection();
    
    $sqlCheck = "SELECT COUNT(*) as count FROM dbo.Usuarios WHERE correo = ?";
    $stmtCheck = sqlsrv_prepare($conn, $sqlCheck, array(&$correo));
    
    if (!$stmtCheck || !sqlsrv_execute($stmtCheck)) {
        throw new Exception('Error al verificar correo: ' . print_r(sqlsrv_errors(), true));
    }
    
    $row = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
    
    if ($row['count'] > 0) {
        sqlsrv_free_stmt($stmtCheck);
        $database->closeConnection();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado.']);
        exit();
    }
    
    sqlsrv_free_stmt($stmtCheck);
    
    // Tipo de cuenta opcional, por defecto '1'
    $tipo_cuenta = isset($data['tipo_cuenta']) && trim($data['tipo_cuenta']) !== '' ? trim($data['tipo_cuenta']) : '1';
    
    // Insertar usuario con OUTPUT
    $sqlInsert = "INSERT INTO dbo.Usuarios (nombre, correo, contrasena, rol, cedula, direccion, telefono, tipo_cuenta) 
                  OUTPUT INSERTED.id_usuario
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $params = array($nombre, $correo, $contrasenaHash, $rol, $cedula, $direccion, $telefono, $tipo_cuenta);
    $stmtInsert = sqlsrv_prepare($conn, $sqlInsert, $params);
    
    if (!$stmtInsert || !sqlsrv_execute($stmtInsert)) {
        throw new Exception('Error al insertar usuario: ' . print_r(sqlsrv_errors(), true));
    }
    
    // Obtener el ID del usuario recién creado
    $lastIdRow = sqlsrv_fetch_array($stmtInsert, SQLSRV_FETCH_ASSOC);
    $idUsuario = $lastIdRow['id_usuario'];
    
    if (!$idUsuario) {
        throw new Exception('No se pudo obtener el ID del usuario creado');
    }
    
    sqlsrv_free_stmt($stmtInsert);
    
    // Crear registro en tabla Clientes con OUTPUT
    $sqlCliente = "INSERT INTO dbo.Clientes (id_usuario, cedula, direccion, telefono) 
                   OUTPUT INSERTED.id_cliente
                   VALUES (?, ?, ?, ?)";
    $paramsCliente = array($idUsuario, $cedula, $direccion, $telefono);
    $stmtCliente = sqlsrv_prepare($conn, $sqlCliente, $paramsCliente);
    
    if (!$stmtCliente || !sqlsrv_execute($stmtCliente)) {
        throw new Exception('Error al crear cliente: ' . print_r(sqlsrv_errors(), true));
    }
    
    // Obtener el id_cliente recién creado
    $idClienteRow = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
    $idCliente = $idClienteRow['id_cliente'];
    
    if (!$idCliente) {
        throw new Exception('No se pudo obtener el ID del cliente creado');
    }
    
    sqlsrv_free_stmt($stmtCliente);
    
    // Generar número de cuenta
    $prefijo = str_pad($tipo_cuenta, 2, '0', STR_PAD_LEFT);
    $userId6 = str_pad($idUsuario, 6, '0', STR_PAD_LEFT);
    $random6 = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    $numeroCuenta = $prefijo . '-' . $userId6 . '-' . $random6;
    
    // Crear cuenta bancaria
    $sqlCuenta = "INSERT INTO dbo.Cuentas (id_cliente, numero_cuenta, tipo_cuenta, saldo) 
                  VALUES (?, ?, ?, 0.00)";
    $paramsCuenta = array($idCliente, $numeroCuenta, intval($tipo_cuenta));
    $stmtCuenta = sqlsrv_prepare($conn, $sqlCuenta, $paramsCuenta);
    
    if (!$stmtCuenta || !sqlsrv_execute($stmtCuenta)) {
        throw new Exception('Error al crear cuenta: ' . print_r(sqlsrv_errors(), true));
    }
    
    sqlsrv_free_stmt($stmtCuenta);
    $database->closeConnection();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Usuario creado exitosamente.',
        'data' => [
            'id_usuario' => $idUsuario,
            'nombre' => $nombre,
            'correo' => $correo,
            'rol' => $rol,
            'numero_cuenta' => $numeroCuenta
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Error en create.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor.',
        'error' => $e->getMessage()
    ]);
}
