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
    $requiredFields = ['nombre', 'correo', 'cedula', 'direccion', 'telefono', 'tipo_cuenta', 'password'];
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

    // Llamar al procedimiento almacenado (sin username)
    $sql = "{CALL dbo.sp_registrar_usuario_cliente(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
    
    $resultado = 0;
    $mensaje = '';
    $idUsuario = 0;
    $idCliente = 0;
    $numeroCuenta = '';
    
    $params = [
        $nombre,
        $correo,
        $cedula,
        $direccion,
        $telefono,
        intval($tipo_cuenta),
        $passwordHash,
        $rol,
        0.00, // saldo inicial
        array(&$resultado, SQLSRV_PARAM_OUT),
        array(&$mensaje, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
        array(&$idUsuario, SQLSRV_PARAM_OUT),
        array(&$idCliente, SQLSRV_PARAM_OUT),
        array(&$numeroCuenta, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR))
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
    // $resultado, $mensaje, $idUsuario, $idCliente, $numeroCuenta ya tienen los valores
    
    sqlsrv_free_stmt($stmt);
    
    // Verificar resultado
    if ($resultado !== 0) {
        $database->closeConnection();
        
        // Mapear códigos de error
        $httpCode = ($resultado === -2 || $resultado === -3) ? 409 : 400;
        http_response_code($httpCode);
        echo json_encode([
            'status' => 'error',
            'message' => $mensaje
        ]);
        exit();
    }

    // Enviar notificación de cuenta creada
    try {
        if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
            require_once __DIR__ . '/../Services/NotificationService.php';
            $notificationService = new NotificationService();
            $notificationService->notificarCuentaCreada($idCliente, $numeroCuenta, intval($tipo_cuenta));
        }
    } catch (Exception $notifError) {
        error_log('Error enviando notificación de cuenta creada: ' . $notifError->getMessage());
        // No fallar el registro si la notificación falla
    }

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
