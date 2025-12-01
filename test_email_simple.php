<?php
/**
 * Prueba simplificada del sistema de correos sin interacción
 */

echo "=== PRUEBA AUTOMÁTICA DEL SISTEMA DE CORREOS ===\n\n";

// PASO 1: Verificar vendor
echo "1. Verificando dependencias...\n";
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "   ❌ ERROR: vendor/autoload.php no existe\n\n";
    exit(1);
}
echo "   ✅ Dependencias disponibles\n\n";

// PASO 2: Cargar PHPMailer
echo "2. Cargando PHPMailer...\n";
require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    echo "   ❌ ERROR: Clase PHPMailer no encontrada\n\n";
    exit(1);
}
echo "   ✅ PHPMailer cargado correctamente\n\n";

// PASO 3: Probar conexión SMTP
echo "3. Probando conexión SMTP...\n";
$mail = new PHPMailer(true);

try {
    $mail->SMTPDebug = 0; // Sin debug para output limpio
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'serviciocontactoventaonline@gmail.com';
    $mail->Password   = 'hbon bfqz wroe bmzm';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 30;

    echo "   ✅ Configuración SMTP establecida\n";
    
    // Probar conexión
    if ($mail->smtpConnect()) {
        echo "   ✅ Conexión al servidor SMTP exitosa\n";
        $mail->smtpClose();
    } else {
        echo "   ❌ ERROR: No se pudo conectar al servidor SMTP\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "   ❌ EXCEPCIÓN al configurar SMTP: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "\n";
echo "=== RESULTADO DEL DIAGNÓSTICO ===\n";
echo "✅ Todas las verificaciones pasaron exitosamente\n";
echo "✅ El sistema de correos está configurado correctamente\n";
echo "✅ PHPMailer puede conectarse a Gmail SMTP\n\n";

echo "NOTA: Para probar el envío real de un email, usa el NotificationService.php\n";
echo "      desde las APIs (register.php, create.php, transferir.php)\n\n";
