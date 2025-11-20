<?php
// Configurar sesión
require_once __DIR__ . '/../../config/session.php';
session_start();

// Configuración de headers y CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar que el usuario sea admin
if (!isset($_SESSION['usuario_id']) || ($_SESSION['rol'] ?? '') !== 'Administrador') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit();
}

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getConfiguracion($conn);
        break;
    case 'PUT':
        updateConfiguracion($conn);
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
        break;
}

function getConfiguracion($conn)
{
    try {
        // Crear tabla de configuraciones si no existe
        $sql = "IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'configuraciones')
                CREATE TABLE configuraciones (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    clave NVARCHAR(100) UNIQUE NOT NULL,
                    valor NTEXT,
                    descripcion NTEXT,
                    tipo NVARCHAR(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
                    fecha_actualizacion DATETIME2 DEFAULT GETDATE()
                )";
        sqlsrv_query($conn, $sql);

        // Insertar configuraciones por defecto si no existen
        $configDefecto = [
            ['limite_transferencia_diaria', '10000', 'Límite máximo de transferencia por día', 'number'],
            ['limite_transferencia_por_transaccion', '5000', 'Límite máximo por transacción individual', 'number'],
            ['comision_transferencia', '2.50', 'Comisión por transferencia', 'number'],
            ['email_notificaciones', 'admin@exosbank.com', 'Email para notificaciones del sistema', 'string'],
            ['mantenimiento_activo', 'false', 'Modo mantenimiento activado', 'boolean'],
            ['mensaje_mantenimiento', 'Sistema en mantenimiento. Disculpe las molestias.', 'Mensaje mostrado durante mantenimiento', 'string'],
            ['backup_automatico', 'true', 'Backup automático activado', 'boolean'],
            ['retenciones_activas', 'false', 'Sistema de retenciones fiscales', 'boolean'],
            ['porcentaje_retencion', '0.15', 'Porcentaje de retención fiscal', 'number'],
            ['moneda_base', 'USD', 'Moneda base del sistema', 'string'],
            ['smtp_habilitado', 'true', 'Habilitar envío de emails por SMTP', 'boolean'],
            ['smtp_host', 'smtp.gmail.com', 'Servidor SMTP para envío de emails', 'string'],
            ['smtp_port', '587', 'Puerto del servidor SMTP', 'number'],
            ['smtp_username', 'serviciocontactoventaonline@gmail.com', 'Usuario para autenticación SMTP', 'string'],
            ['smtp_password', 'hbon bfqz wroe bmzm', 'Contraseña para autenticación SMTP', 'string'],
            ['mail_from_address', 'serviciocontactoventaonline@gmail.com', 'Dirección de correo remitente', 'string'],
            ['mail_from_name', 'ExosBank - Sistema Bancario', 'Nombre del remitente', 'string'],
            ['notificar_cuenta_creada', 'true', 'Enviar notificación al crear cuenta', 'boolean'],
            ['notificar_transferencias', 'true', 'Enviar notificación en transferencias', 'boolean']
        ];

        foreach ($configDefecto as $config) {
            $sql = "IF NOT EXISTS (SELECT 1 FROM configuraciones WHERE clave = ?)
                    INSERT INTO configuraciones (clave, valor, descripcion, tipo) VALUES (?, ?, ?, ?)";
            $params = [$config[0], $config[0], $config[1], $config[2], $config[3]];
            sqlsrv_query($conn, $sql, $params);
        }

        // Obtener todas las configuraciones
        $sql = "SELECT clave, valor, descripcion, tipo, fecha_actualizacion FROM configuraciones ORDER BY clave";
        $stmt = sqlsrv_query($conn, $sql);

        $configuraciones = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $configuraciones[] = $row;
        }

        // Convertir valores según tipo
        foreach ($configuraciones as &$config) {
            switch ($config['tipo']) {
                case 'number':
                    $config['valor'] = floatval($config['valor']);
                    break;
                case 'boolean':
                    $config['valor'] = $config['valor'] === 'true';
                    break;
                case 'json':
                    $config['valor'] = json_decode($config['valor'], true);
                    break;
            }
        }

        echo json_encode([
            'status' => 'ok',
            'data' => ['configuraciones' => $configuraciones]
        ]);
    } catch (Exception $e) {
        error_log("Error en getConfiguracion: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor']);
    }
}

function updateConfiguracion($conn)
{
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['configuraciones']) || !is_array($input['configuraciones'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Datos inválidos']);
            return;
        }

        sqlsrv_begin_transaction($conn);

        foreach ($input['configuraciones'] as $config) {
            if (!isset($config['clave']) || !isset($config['valor'])) {
                continue;
            }

            // Convertir valor según tipo
            $valor = $config['valor'];
            if (isset($config['tipo'])) {
                switch ($config['tipo']) {
                    case 'boolean':
                        $valor = $valor ? 'true' : 'false';
                        break;
                    case 'json':
                        $valor = json_encode($valor);
                        break;
                    default:
                        $valor = strval($valor);
                        break;
                }
            }

            $sql = "UPDATE configuraciones SET valor = ?, fecha_actualizacion = GETDATE() WHERE clave = ?";
            $params = [$valor, $config['clave']];
            sqlsrv_query($conn, $sql, $params);
        }

        sqlsrv_commit($conn);

        echo json_encode([
            'status' => 'ok',
            'message' => 'Configuración actualizada correctamente'
        ]);
    } catch (Exception $e) {
        sqlsrv_rollback($conn);
        error_log("Error en updateConfiguracion: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al actualizar configuración']);
    }
}
