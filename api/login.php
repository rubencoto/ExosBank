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

    // Buscar usuario por email
    $sql = "SELECT id_usuario, nombre, correo, contrasena, rol FROM dbo.Usuarios WHERE correo = ?";
    $stmt = sqlsrv_prepare($conn, $sql, array(&$email));

    if (!$stmt || !sqlsrv_execute($stmt)) {
        throw new Exception('Error al buscar usuario');
    }

    $usuario = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

    if (!$usuario) {
        sqlsrv_free_stmt($stmt);
        $database->closeConnection();
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Credenciales incorrectas'
        ]);
        exit();
    }

    // Verificar contraseña
    if (!password_verify($password, $usuario['contrasena'])) {
        sqlsrv_free_stmt($stmt);
        $database->closeConnection();
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Credenciales incorrectas'
        ]);
        exit();
    }

    // Login exitoso - crear sesión
    $_SESSION['usuario_id'] = $usuario['id_usuario'];
    $_SESSION['nombre'] = $usuario['nombre'];
    $_SESSION['correo'] = $usuario['correo'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['logged_in'] = true;

    // Crear token JWT
    require_once __DIR__ . '/../config/jwt.php';
    $tokenPayload = [
        'user_id' => $usuario['id_usuario'],
        'nombre' => $usuario['nombre'],
        'correo' => $usuario['correo'],
        'rol' => $usuario['rol'],
        'iat' => time(),
        'exp' => time() + 3600 // 1 hora
    ];
    $token = JWTHelper::encode($tokenPayload);

    sqlsrv_free_stmt($stmt);
    $database->closeConnection();

    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'message' => 'Login exitoso',
        'token' => $token,
        'data' => [
            'id_usuario' => $usuario['id_usuario'],
            'nombre' => $usuario['nombre'],
            'correo' => $usuario['correo'],
            'rol' => $usuario['rol']
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
