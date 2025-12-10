<?php
// Suprimir todos los errores de display para garantizar salida JSON limpia
error_reporting(0);
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');

// Configurar sesión
require_once __DIR__ . '/../../config/session.php';
session_start();

// Limpiar cualquier salida previa
if (ob_get_level()) ob_end_clean();
ob_start();

// Configuración de headers y CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (ob_get_level()) ob_end_clean();
    http_response_code(200);
    exit();
}

// Validar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (ob_get_level()) ob_end_clean();
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

// Verificar sesión activa
if (!isset($_SESSION['usuario_id'])) {
    if (ob_get_level()) ob_end_clean();
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
    if (ob_get_level()) ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Datos inválidos'
    ]);
    exit();
}

// Validar campos requeridos
if (empty($data['currentPassword']) || empty($data['newPassword'])) {
    if (ob_get_level()) ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'La contraseña actual y la nueva son obligatorias'
    ]);
    exit();
}

// Validar longitud de nueva contraseña
if (strlen($data['newPassword']) < 6) {
    if (ob_get_level()) ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'La nueva contraseña debe tener al menos 6 caracteres'
    ]);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $userId = $_SESSION['usuario_id'];

    // Primero, obtener el hash actual de la base de datos
    $sqlGetHash = "SELECT contrasena FROM dbo.Usuarios WHERE id_usuario = ?";
    $stmt = $database->executeQuery($sqlGetHash, [$userId]);
    
    if (!$stmt) {
        throw new Exception('Error al obtener información del usuario');
    }

    $currentHashFromDB = null;
    if ($database->fetch($stmt)) {
        $currentHashFromDB = $database->getField($stmt, 0);
    }
    $database->freeStatement($stmt);

    if (!$currentHashFromDB) {
        if (ob_get_level()) ob_end_clean();
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Usuario no encontrado'
        ]);
        exit();
    }

    // Verificar que la contraseña actual sea correcta
    if (!password_verify($data['currentPassword'], $currentHashFromDB)) {
        if (ob_get_level()) ob_end_clean();
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'La contraseña actual es incorrecta'
        ]);
        exit();
    }

    // Generar hash para la nueva contraseña
    $newPasswordHash = password_hash($data['newPassword'], PASSWORD_DEFAULT);

    // Ejecutar el procedimiento almacenado
    $sql = "
        DECLARE @result_code INT = 0;
        DECLARE @result_message NVARCHAR(500) = '';
        
        EXEC dbo.sp_update_user_password 
            @p_user_id = ?, 
            @p_current_password_hash = ?,
            @p_new_password_hash = ?,
            @p_result_code = @result_code OUTPUT,
            @p_result_message = @result_message OUTPUT;
        
        SELECT @result_code as result_code, @result_message as result_message;
    ";

    $params = array(
        $userId,
        $currentHashFromDB,  // Pasamos el hash actual para validación en SP
        $newPasswordHash     // Hash de la nueva contraseña
    );

    $stmt = $database->executeQuery($sql, $params);

    if (!$stmt) {
        throw new Exception('Error al ejecutar procedimiento almacenado');
    }

    $resultCode = 0;
    $resultMessage = '';

    if ($database->fetch($stmt)) {
        $resultCode = $database->getField($stmt, 0);
        $resultMessage = $database->getField($stmt, 1);
    }
    $database->freeStatement($stmt);

    // Verificar el resultado del procedimiento
    if ($resultCode !== 0) {
        $httpCode = 400;

        // Mapear códigos de error específicos
        switch ($resultCode) {
            case 1:
                $httpCode = 404; // Usuario no encontrado
                break;
            case 2:
                $httpCode = 400; // Contraseña actual incorrecta
                break;
            case 3:
                $httpCode = 500; // Error al actualizar
                break;
            default:
                $httpCode = 500;
                break;
        }

        if (ob_get_level()) ob_end_clean();
        http_response_code($httpCode);
        echo json_encode([
            'status' => 'error',
            'message' => $resultMessage,
            'code' => $resultCode
        ]);
        exit();
    }

    // Éxito
    if (ob_get_level()) ob_end_clean();
    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'message' => $resultMessage
    ]);

} catch (Exception $e) {
    if (ob_get_level()) ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error al cambiar contraseña: ' . $e->getMessage()
    ]);
}
