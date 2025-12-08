<?php
// Configurar sesión
require_once __DIR__ . '/../config/session.php';
session_start();

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
    if (!isset($data['email']) || !isset($data['password'])) {
        throw new Exception('Email y contraseña son requeridos');
    }

    $email = trim($data['email']);
    $password = $data['password'];

    // Validar formato de email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Formato de email inválido');
    }

    // Conectar a la base de datos
    $database = new Database();
    $conn = $database->getConnection();

    // Llamar al procedimiento almacenado de validación
    $sql = "{CALL dbo.sp_validar_login(?, ?, ?, ?, ?, ?, ?)}";
    
    $resultado = 0;
    $mensaje = '';
    $idUsuario = 0;
    $nombre = '';
    $rol = '';
    $passwordHash = '';
    
    $params = [
        $email,
        array(&$resultado, SQLSRV_PARAM_OUT),
        array(&$mensaje, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
        array(&$idUsuario, SQLSRV_PARAM_OUT),
        array(&$nombre, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
        array(&$rol, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
        array(&$passwordHash, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR))
    ];
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if (!$stmt) {
        $errors = sqlsrv_errors();
        $errorMsg = is_array($errors) && !empty($errors) ? $errors[0]['message'] : 'Error desconocido';
        throw new Exception('Error ejecutando procedimiento almacenado: ' . $errorMsg);
    }
    
    // Procesar todos los result sets para que los OUTPUT params se llenen
    while (sqlsrv_next_result($stmt) !== null) {
        // Continuar procesando hasta que no haya más result sets
    }
    
    // Los valores de salida ya están en las variables por referencia
    // $resultado, $mensaje, $idUsuario, $nombre, $rol, $passwordHash ya tienen los valores
    
    sqlsrv_free_stmt($stmt);

    // Verificar si el usuario fue encontrado
    if ($resultado !== 0) {
        $database->closeConnection();
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Credenciales incorrectas'
        ]);
        exit();
    }

    // Verificar contraseña
    if (!password_verify($password, $passwordHash)) {
        $database->closeConnection();
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Credenciales incorrectas'
        ]);
        exit();
    }

    // Login exitoso - crear sesión
    $_SESSION['usuario_id'] = $idUsuario;
    $_SESSION['nombre'] = $nombre;
    $_SESSION['correo'] = $email;
    $_SESSION['rol'] = $rol;
    $_SESSION['logged_in'] = true;

    // Crear token JWT
    require_once __DIR__ . '/../config/jwt.php';
    $tokenPayload = [
        'user_id' => $idUsuario,
        'nombre' => $nombre,
        'correo' => $email,
        'rol' => $rol,
        'iat' => time(),
        'exp' => time() + 3600 // 1 hora
    ];
    $token = JWTHelper::encode($tokenPayload);

    $database->closeConnection();

    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'message' => 'Login exitoso',
        'token' => $token,
        'data' => [
            'id_usuario' => $idUsuario,
            'nombre' => $nombre,
            'correo' => $email,
            'rol' => $rol
        ]
    ]);
} catch (Exception $e) {
    error_log('Error en login.php: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
