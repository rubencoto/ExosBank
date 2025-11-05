<?php
// Configurar sesión antes de iniciarla si es necesario
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', 'false');
ini_set('session.cookie_httponly', 'true');
ini_set('session.use_cookies', '1');
ini_set('session.use_only_cookies', '1');

// Configuración de headers y CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

try {
    // Obtener datos JSON del request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido');
    }
    
    // Validar campos requeridos
    $requiredFields = ['nombre', 'correo', 'cedula', 'direccion', 'telefono', 'tipo_cuenta', 'username', 'password'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        throw new Exception('Campos requeridos faltantes: ' . implode(', ', $missingFields));
    }
    
    // Extraer y validar datos
    $nombre = trim($data['nombre']);
    $correo = trim($data['correo']);
    $cedula = trim($data['cedula']);
    $direccion = trim($data['direccion']);
    $telefono = trim($data['telefono']);
    $tipo_cuenta = trim($data['tipo_cuenta']);
    $username = trim($data['username']);
    $password = $data['password'];
    
    // Validar formato de correo
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Formato de correo electrónico inválido');
    }
    
    // Validar longitud de contraseña
    if (strlen($password) < 6) {
        throw new Exception('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Validar tipo de cuenta
    $lastDigit = substr($tipo_cuenta, -1);
    $rol = 'Cliente'; // Registro público siempre crea clientes
    
    // Hashear contraseña
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Conectar a la base de datos
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verificar si el correo ya está registrado
    $sqlCheckEmail = "SELECT COUNT(*) as count FROM dbo.Usuarios WHERE correo = ?";
    $stmtCheck = sqlsrv_prepare($conn, $sqlCheckEmail, array(&$correo));
    
    if (!$stmtCheck || !sqlsrv_execute($stmtCheck)) {
        throw new Exception('Error al verificar correo: ' . print_r(sqlsrv_errors(), true));
    }
    
    $row = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
    if ($row['count'] > 0) {
        sqlsrv_free_stmt($stmtCheck);
        $database->closeConnection();
        http_response_code(409);
        echo json_encode([
            'status' => 'error',
            'message' => 'El correo electrónico ya está registrado'
        ]);
        exit();
    }
    sqlsrv_free_stmt($stmtCheck);
    
    // Verificar username duplicado
    $sqlCheckUsername = "SELECT COUNT(*) as count FROM dbo.Usuarios WHERE correo = ?";
    
    // Insertar usuario con OUTPUT
    $sqlInsert = "INSERT INTO dbo.Usuarios (nombre, correo, contrasena, rol, cedula, direccion, telefono, tipo_cuenta) 
                  OUTPUT INSERTED.id_usuario
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    $params = array($nombre, $correo, $passwordHash, $rol, $cedula, $direccion, $telefono, $tipo_cuenta);
    $stmtInsert = sqlsrv_prepare($conn, $sqlInsert, $params);
    
    if (!$stmtInsert || !sqlsrv_execute($stmtInsert)) {
        throw new Exception('Error al crear usuario: ' . print_r(sqlsrv_errors(), true));
    }
    
    // Obtener el ID del usuario recién creado
    $idRow = sqlsrv_fetch_array($stmtInsert, SQLSRV_FETCH_ASSOC);
    $idUsuario = $idRow['id_usuario'];
    
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
    
    // Generar número de cuenta de 11 dígitos donde el último dígito indica el tipo
    // Formato: 10 dígitos aleatorios + 1 dígito del tipo de cuenta
    // Ejemplo: 12345678901 (tipo 1 = Corriente), 12345678902 (tipo 2 = Ahorro), 12345678903 (tipo 3 = Crédito)
    $random10 = str_pad(rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
    $numeroCuenta = $random10 . $tipo_cuenta; // 10 dígitos random + 1 dígito tipo
    
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
    
    // Respuesta exitosa
    http_response_code(201);
    echo json_encode([
        'status' => 'ok',
        'message' => 'Registro exitoso. Ya puedes iniciar sesión.',
        'data' => [
            'id_usuario' => $idUsuario,
            'nombre' => $nombre,
            'correo' => $correo,
            'rol' => $rol,
            'numero_cuenta' => $numeroCuenta
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Error en register.php: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
