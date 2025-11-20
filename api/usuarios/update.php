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
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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

    // Obtener IP del cliente para auditoría
    $clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    // Intentar usar el procedimiento almacenado si está disponible
    $useStoredProcedure = true;
    $resultCode = 0;
    $resultMessage = '';

    if ($useStoredProcedure) {
        try {
            // Ejecutar el procedimiento almacenado usando una consulta directa
            $sql = "
                DECLARE @result_code INT = 0;
                DECLARE @result_message NVARCHAR(500) = '';
                
                EXEC dbo.sp_update_user_profile 
                    @p_user_id = ?, 
                    @p_nombre = ?, 
                    @p_correo = ?, 
                    @p_cedula = ?, 
                    @p_direccion = ?, 
                    @p_telefono = ?,
                    @p_result_code = @result_code OUTPUT,
                    @p_result_message = @result_message OUTPUT;
                
                SELECT @result_code as result_code, @result_message as result_message;
            ";

            $params = array(
                $userId,
                $data['nombre'],
                $data['correo'],
                $data['cedula'],
                $data['direccion'],
                $data['telefono']
            );

            $stmt = $database->executeQuery($sql, $params);

            if ($stmt) {
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
                            $httpCode = 404;
                            break;
                        case 2:
                        case 3:
                            $httpCode = 409; // Conflict
                            break;
                        case 4:
                            $httpCode = 500;
                            break;
                        case 99:
                            $httpCode = 500;
                            break;
                    }

                    http_response_code($httpCode);
                    echo json_encode([
                        'status' => 'error',
                        'message' => $resultMessage,
                        'error_code' => $resultCode
                    ]);
                    exit();
                }
            } else {
                // Si falla el procedimiento almacenado, usar método tradicional
                $useStoredProcedure = false;
            }
        } catch (Exception $spException) {
            // Si hay error con el procedimiento almacenado, usar método tradicional
            $useStoredProcedure = false;
        }
    }

    // Método tradicional si el procedimiento almacenado no está disponible
    if (!$useStoredProcedure) {
        // Verificar si el email ya existe para otro usuario
        $queryCheck = "SELECT id_usuario FROM dbo.Usuarios WHERE correo = ? AND id_usuario != ?";
        $stmtCheck = $database->executeQuery($queryCheck, array($data['correo'], $userId));

        if ($stmtCheck) {
            if ($database->fetch($stmtCheck)) {
                $database->freeStatement($stmtCheck);
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'El correo ya está registrado'
                ]);
                exit();
            }
            $database->freeStatement($stmtCheck);
        }

        // Actualizar datos en tabla Usuarios
        $queryUpdate = "UPDATE dbo.Usuarios 
                        SET nombre = ?, correo = ?, cedula = ?, direccion = ?, telefono = ?, fecha_actualizacion = GETDATE()
                        WHERE id_usuario = ?";

        $params = array(
            $data['nombre'],
            $data['correo'],
            $data['cedula'],
            $data['direccion'],
            $data['telefono'],
            $userId
        );

        $stmtUpdate = $database->executeQuery($queryUpdate, $params);

        if (!$stmtUpdate) {
            throw new Exception('Error al actualizar usuario');
        }

        $database->freeStatement($stmtUpdate);

        // Actualizar datos en tabla Clientes
        $queryUpdateCliente = "UPDATE dbo.Clientes 
                               SET cedula = ?, direccion = ?, telefono = ?, fecha_actualizacion = GETDATE()
                               WHERE id_usuario = ?";

        $paramsCliente = array(
            $data['cedula'],
            $data['direccion'],
            $data['telefono'],
            $userId
        );

        $stmtUpdateCliente = $database->executeQuery($queryUpdateCliente, $paramsCliente);

        if ($stmtUpdateCliente) {
            $database->freeStatement($stmtUpdateCliente);
        }

        // Insertar registro de auditoría manual
        $auditSQL = "INSERT INTO dbo.Auditoria (id_usuario, accion, detalles, fecha_accion, ip_address) 
                     VALUES (?, 'UPDATE_PROFILE', ?, GETDATE(), ?)";
        $auditParams = array(
            $userId,
            'Actualización de perfil de usuario: ' . $data['nombre'],
            $clientIP
        );

        $stmtAudit = $database->executeQuery($auditSQL, $auditParams);
        if ($stmtAudit) {
            $database->freeStatement($stmtAudit);
        }

        $resultMessage = 'Perfil actualizado correctamente';
    }

    // Actualizar datos de sesión
    $_SESSION['nombre'] = $data['nombre'];
    $_SESSION['correo'] = $data['correo'];

    $database->closeConnection();

    echo json_encode([
        'status' => 'ok',
        'message' => $resultMessage,
        'data' => [
            'nombre' => $data['nombre'],
            'correo' => $data['correo'],
            'cedula' => $data['cedula'],
            'direccion' => $data['direccion'],
            'telefono' => $data['telefono']
        ],
        'method' => $useStoredProcedure ? 'stored_procedure' : 'traditional'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor'
    ]);
}
