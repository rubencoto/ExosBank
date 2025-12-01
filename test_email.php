<?php
/**
 * Script de diagnóstico para el sistema de correos
 * Prueba paso a paso el envío de emails con PHPMailer
 */

echo "=== DIAGNÓSTICO DEL SISTEMA DE CORREOS ===\n\n";

// PASO 1: Verificar que vendor existe
echo "1. Verificando dependencias de Composer...\n";
if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "   ❌ ERROR CRÍTICO: vendor/autoload.php no existe\n";
    echo "   SOLUCIÓN: Ejecuta 'composer install' en el directorio del proyecto\n";
    echo "   O descarga composer.phar y ejecuta: php composer.phar install\n\n";
    exit(1);
} else {
    echo "   ✅ vendor/autoload.php existe\n\n";
}

// PASO 2: Cargar PHPMailer
echo "2. Cargando PHPMailer...\n";
try {
    require_once __DIR__ . '/vendor/autoload.php';
    echo "   ✅ PHPMailer cargado correctamente\n\n";
} catch (Exception $e) {
    echo "   ❌ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// PASO 3: Verificar clase PHPMailer
echo "3. Verificando clase PHPMailer...\n";
if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    echo "   ✅ Clase PHPMailer disponible\n\n";
} else {
    echo "   ❌ ERROR: Clase PHPMailer no encontrada\n\n";
    exit(1);
}

// PASO 4: Verificar extensión OpenSSL
echo "4. Verificando extensión OpenSSL (requerida para SMTP)...\n";
if (extension_loaded('openssl')) {
    echo "   ✅ OpenSSL habilitado\n\n";
} else {
    echo "   ❌ WARNING: OpenSSL no está habilitado\n";
    echo "   SOLUCIÓN: Habilita extension=openssl en php.ini\n\n";
}

// PASO 5: Probar configuración SMTP
echo "5. Probando configuración SMTP...\n";
$mail = new PHPMailer(true);

try {
    // Configuración SMTP
    $mail->SMTPDebug = 2; // Nivel 2 para ver detalles
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
    echo "   - Host: smtp.gmail.com\n";
    echo "   - Puerto: 587\n";
    echo "   - Usuario: serviciocontactoventaonline@gmail.com\n\n";

    // PASO 6: Probar conexión SMTP
    echo "6. Probando conexión al servidor SMTP...\n";
    if ($mail->smtpConnect()) {
        echo "   ✅ Conexión SMTP exitosa\n\n";
        $mail->smtpClose();
    } else {
        echo "   ❌ ERROR: No se pudo conectar al servidor SMTP\n\n";
    }

    // PASO 7: Intentar enviar email de prueba
    echo "7. Intentando enviar email de prueba...\n";
    echo "   ¿Deseas enviar un email de prueba? (Presiona Ctrl+C para cancelar)\n";
    echo "   Ingresa el email destino o presiona Enter para usar el remitente:\n";
    
    $destino = trim(fgets(STDIN));
    if (empty($destino)) {
        $destino = 'serviciocontactoventaonline@gmail.com';
    }

    $mail->setFrom('serviciocontactoventaonline@gmail.com', 'ExosBank - Sistema Bancario');
    $mail->addAddress($destino);
    $mail->isHTML(true);
    $mail->Subject = 'Prueba de correo - ExosBank';
    $mail->Body    = '<h1>Email de prueba</h1><p>Si recibes este correo, el sistema de emails está funcionando correctamente.</p>';
    $mail->AltBody = 'Email de prueba. Si recibes este correo, el sistema está funcionando.';

    if ($mail->send()) {
        echo "   ✅ Email enviado exitosamente a: $destino\n";
        echo "   Verifica tu bandeja de entrada (y spam)\n\n";
    } else {
        echo "   ❌ ERROR al enviar: " . $mail->ErrorInfo . "\n\n";
    }

} catch (Exception $e) {
    echo "   ❌ EXCEPCIÓN: {$mail->ErrorInfo}\n";
    echo "   Detalles: " . $e->getMessage() . "\n\n";
}

echo "=== FIN DEL DIAGNÓSTICO ===\n";
