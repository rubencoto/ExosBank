<?php
// Configurar sesión para validar administrador
require_once __DIR__ . '/../../config/session.php';
session_start();

// Configuración de headers y CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
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
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit();
}

// Validar que sea un administrador autenticado
if (!isset($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? '') !== 'Administrador') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'No tienes permisos para crear usuarios. Solo los administradores pueden realizar esta acción.'
    ]);
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

    // Validar rol específicamente para mapear correctamente
    $rolValido = ($rol === 'admin') ? 'Administrador' : (($rol === 'client') ? 'Cliente' : $rol);

    // Hash de la contraseña
    $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

    // Tipo de cuenta opcional, por defecto 1 (Débito)
    $tipo_cuenta = isset($data['tipo_cuenta']) && is_numeric($data['tipo_cuenta']) ?
        intval($data['tipo_cuenta']) : 1;

    $database = new Database();
    $conn = $database->getConnection();

    // Parámetros de entrada para el procedimiento almacenado
    $params = array(
        array($nombre, SQLSRV_PARAM_IN),
        array($correo, SQLSRV_PARAM_IN),
        array($contrasenaHash, SQLSRV_PARAM_IN),
        array($rolValido, SQLSRV_PARAM_IN),
        array($cedula, SQLSRV_PARAM_IN),
        array($direccion, SQLSRV_PARAM_IN),
        array($telefono, SQLSRV_PARAM_IN),
        array($tipo_cuenta, SQLSRV_PARAM_IN),
        array(&$resultado, SQLSRV_PARAM_OUT),
        array(&$mensaje, SQLSRV_PARAM_OUT),
        array(&$idUsuario, SQLSRV_PARAM_OUT),
        array(&$numeroCuenta, SQLSRV_PARAM_OUT)
    );

    // Variables para capturar los parámetros de salida
    $resultado = 0;
    $mensaje = '';
    $idUsuario = 0;
    $numeroCuenta = '';

    // Ejecutar procedimiento almacenado
    $stmt = sqlsrv_query($conn, "{CALL sp_CrearUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}", $params);

    if ($stmt === false) {
        $errors = sqlsrv_errors();
        $errorMsg = 'Error al ejecutar procedimiento almacenado';
        if ($errors) {
            $errorMsg .= ': ' . $errors[0]['message'];
        }
        throw new Exception($errorMsg);
    }

    // Procesar hasta que se obtengan todos los resultados
    do {
        // Procesar conjunto de resultados si existe
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            // Procesar filas si es necesario
        }
    } while (sqlsrv_next_result($stmt));

    // Liberar statement
    sqlsrv_free_stmt($stmt);

    // Verificar resultado del procedimiento
    if ($resultado <= 0) {
        $database->closeConnection();

        // Mapear códigos de error a códigos HTTP apropiados
        $httpCode = 400; // Bad Request por defecto
        switch ($resultado) {
            case -1: // Correo ya existe
            case -2: // Cédula ya existe
                $httpCode = 409; // Conflict
                break;
            case -3: // Rol inválido
            case -4: // Tipo cuenta inválido
                $httpCode = 400; // Bad Request
                break;
            case -99: // Error interno
            default:
                $httpCode = 500; // Internal Server Error
                break;
        }

        http_response_code($httpCode);
        echo json_encode([
            'success' => false,
            'message' => $mensaje ?: 'Error al crear usuario',
            'codigo_error' => $resultado
        ]);
        exit();
    }

    // Enviar notificación si se creó una cuenta (solo para clientes)
    if (!empty($numeroCuenta) && $rolValido === 'Cliente') {
        try {
            if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
                require_once __DIR__ . '/../../Services/NotificationService.php';
                $notificationService = new NotificationService();
                // Buscar el id_cliente para la notificación
                $sqlCliente = "SELECT id_cliente FROM dbo.Clientes WHERE id_usuario = ?";
                $stmtCliente = sqlsrv_prepare($conn, $sqlCliente, array(&$idUsuario));
                if ($stmtCliente && sqlsrv_execute($stmtCliente)) {
                    $rowCliente = sqlsrv_fetch_array($stmtCliente, SQLSRV_FETCH_ASSOC);
                    if ($rowCliente) {
                        $notificationService->notificarCuentaCreada(
                            $rowCliente['id_cliente'],
                            $numeroCuenta,
                            $tipo_cuenta
                        );
                    }
                    sqlsrv_free_stmt($stmtCliente);
                }
            }
        } catch (Exception $notifError) {
            error_log('Error enviando notificación de cuenta creada: ' . $notifError->getMessage());
            // No fallar el registro si la notificación falla
        }
    }

    $database->closeConnection();

    // Respuesta exitosa
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => $mensaje,
        'data' => [
            'id_usuario' => $idUsuario,
            'nombre' => $nombre,
            'correo' => $correo,
            'rol' => $rolValido,
            'numero_cuenta' => $numeroCuenta ?: null,
            'tipo_cuenta' => $tipo_cuenta
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
