<?php
// Prevenir cualquier output no deseado
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en output
ini_set('log_errors', 1); // Loggear errores

// Configurar sesión primero
require_once __DIR__ . '/../../config/session.php';
session_start();

// Log de inicio de solicitud
error_log('=== TRANSFERIR.PHP INICIO ===');
error_log('Método: ' . $_SERVER['REQUEST_METHOD']);
error_log('Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'no definido'));

// Configuración de headers y CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validar método
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit();
}

// Verificar sesión activa
if (!isset($_SESSION['usuario_id'])) {
    error_log('Transferir.php: No hay sesión activa. SESSION: ' . print_r($_SESSION, true));
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'No hay sesión activa'
    ]);
    exit();
}

error_log('Transferir.php: Sesión activa para usuario ID: ' . $_SESSION['usuario_id']);

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

// Importar sistema de excepciones
require_once __DIR__ . '/../../Exceptions/ExceptionLoader.php';

try {
    $input = file_get_contents('php://input');
    if ($input === false) {
        throw new ServiceException('No se pudo leer el contenido de la solicitud');
    }

    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new InvalidJsonException('JSON inválido: ' . json_last_error_msg());
    }

    $requiredFields = ['cuenta_origen', 'cuenta_destino', 'monto'];
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        throw ExceptionFactory::createMissingFieldsException($missing);
    }

    $cuentaOrigen = trim($data['cuenta_origen']);
    $cuentaDestino = trim($data['cuenta_destino']);
    $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
    $monto = floatval($data['monto']);

    // Validaciones de negocio
    if ($cuentaOrigen === $cuentaDestino) {
        throw new TransactionException('La cuenta destino debe ser diferente a la cuenta origen');
    }

    if ($monto <= 0) {
        throw ExceptionFactory::createInvalidAmountException();
    }

    if ($monto > 100000000) {
        throw new TransactionLimitExceededException('Monto excede el límite permitido (₡100,000,000)');
    }

    if (strlen($descripcion) > 250) {
        $descripcion = substr($descripcion, 0, 250);
    }

    $userId = intval($_SESSION['usuario_id']);
    $database = new Database();
    $conn = $database->getConnection();

    // Llamar al procedimiento almacenado
    $sql = "{CALL dbo.sp_realizar_transferencia(?, ?, ?, ?, ?, ?, ?, ?)}";
    
    $resultado = 0;
    $mensaje = '';
    $idTransaccion = 0;
    
    $params = [
        $userId,
        $cuentaOrigen,
        $cuentaDestino,
        $monto,
        $descripcion,
        array(&$resultado, SQLSRV_PARAM_OUT),
        array(&$mensaje, SQLSRV_PARAM_OUT, SQLSRV_PHPTYPE_STRING(SQLSRV_ENC_CHAR)),
        array(&$idTransaccion, SQLSRV_PARAM_OUT)
    ];
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if (!$stmt) {
        $errors = sqlsrv_errors();
        $errorMsg = is_array($errors) && !empty($errors) ? $errors[0]['message'] : 'Error desconocido';
        throw new DatabaseException('Error ejecutando procedimiento almacenado: ' . $errorMsg);
    }
    
    // Procesar todos los result sets para que los OUTPUT params se llenen
    while (sqlsrv_next_result($stmt) !== null) {
        // Continuar procesando hasta que no haya más result sets
    }
    
    // Los valores de salida ya están en las variables por referencia
    // $resultado, $mensaje, $idTransaccion ya tienen los valores
    
    sqlsrv_free_stmt($stmt);
    
    // Verificar resultado
    if ($resultado !== 0) {
        $database->closeConnection();
        
        // Mapear códigos de error a excepciones apropiadas
        switch ($resultado) {
            case -1:
            case -4:
                throw new TransactionException($mensaje);
            case -2:
                throw ExceptionFactory::createInvalidAmountException();
            case -3:
                throw new TransactionLimitExceededException($mensaje);
            case -5:
                throw ExceptionFactory::createInsufficientFundsException();
            case -6:
                throw new AccountNotFoundException($mensaje);
            default:
                throw new DatabaseException($mensaje);
        }
    }
    
    try {
        // Enviar notificaciones de transferencia
        if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
            require_once __DIR__ . '/../../Services/NotificationService.php';
            $notificationService = new NotificationService();

            error_log('Iniciando envío de notificaciones para transacción: ' . $idTransaccion);

            // Notificar al emisor (débito)
            $resultEmisor = $notificationService->notificarTransferencia($idTransaccion, 'enviada');
            error_log('Notificación de débito enviada: ' . ($resultEmisor ? 'éxito' : 'fallo'));

            // Notificar al receptor (crédito)
            $resultReceptor = $notificationService->notificarTransferencia($idTransaccion, 'recibida');
            error_log('Notificación de crédito enviada: ' . ($resultReceptor ? 'éxito' : 'fallo'));
        }
    } catch (NotificationException $notifError) {
        error_log('Error en notificaciones: ' . $notifError->getMessage());
        // Continuar ya que la transferencia fue exitosa
    } catch (Exception $notifError) {
        error_log('Error inesperado en notificaciones: ' . $notifError->getMessage());
        // Continuar ya que la transferencia fue exitosa
    }

    $database->closeConnection();

    $responseData = [
        'status' => 'ok',
        'message' => $mensaje,
        'data' => [
            'id_transaccion' => $idTransaccion,
            'cuenta_origen' => $cuentaOrigen,
            'cuenta_destino' => $cuentaDestino,
            'monto' => round($monto, 2)
        ]
    ];
    
    error_log('Transferencia exitosa. Enviando respuesta: ' . json_encode($responseData));
    echo json_encode($responseData);
    exit();
} catch (BaseException $e) {
    // Las excepciones personalizadas manejan su propia respuesta HTTP
    $e->sendJsonResponse();
    exit();
} catch (Exception $e) {
    error_log('Error crítico en transferir.php: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error interno del servidor',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}
