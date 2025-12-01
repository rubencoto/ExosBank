<?php
/**
 * Verifica la configuración de PHP relacionada con el envío de correos
 */

echo "=== CONFIGURACIÓN PHP PARA CORREOS ===\n\n";

// Extensiones necesarias
echo "1. EXTENSIONES PHP:\n";
$extensions = ['openssl', 'sockets', 'mbstring'];
foreach ($extensions as $ext) {
    $loaded = extension_loaded($ext);
    echo "   " . ($loaded ? "✅" : "❌") . " $ext: " . ($loaded ? "CARGADO" : "NO CARGADO") . "\n";
}
echo "\n";

// Configuración SMTP de PHP
echo "2. CONFIGURACIÓN SMTP DE PHP (php.ini):\n";
$smtp_settings = [
    'SMTP' => ini_get('SMTP'),
    'smtp_port' => ini_get('smtp_port'),
    'sendmail_from' => ini_get('sendmail_from'),
    'sendmail_path' => ini_get('sendmail_path'),
];

foreach ($smtp_settings as $key => $value) {
    echo "   $key: " . ($value ?: '(no configurado)') . "\n";
}
echo "\n";

// Configuración de timeouts
echo "3. TIMEOUTS:\n";
echo "   default_socket_timeout: " . ini_get('default_socket_timeout') . " segundos\n";
echo "   max_execution_time: " . ini_get('max_execution_time') . " segundos\n\n";

// Funciones de mail disponibles
echo "4. FUNCIONES DE MAIL:\n";
echo "   mail(): " . (function_exists('mail') ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE") . "\n";
echo "   fsockopen(): " . (function_exists('fsockopen') ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE") . "\n\n";

// Información de PHP
echo "5. INFORMACIÓN PHP:\n";
echo "   Versión PHP: " . PHP_VERSION . "\n";
echo "   PHP.ini: " . php_ini_loaded_file() . "\n";
echo "   Sistema: " . PHP_OS . "\n\n";

// Verificar firewall/conectividad
echo "6. PRUEBA DE CONECTIVIDAD:\n";
echo "   Probando conexión a smtp.gmail.com:587...\n";
$conn = @fsockopen('smtp.gmail.com', 587, $errno, $errstr, 10);
if ($conn) {
    echo "   ✅ Conexión exitosa al servidor SMTP\n";
    fclose($conn);
} else {
    echo "   ❌ ERROR: No se pudo conectar ($errno: $errstr)\n";
    echo "   Posibles causas:\n";
    echo "   - Firewall bloqueando el puerto 587\n";
    echo "   - Antivirus bloqueando conexiones SMTP\n";
    echo "   - Problemas de red/DNS\n";
}
echo "\n";

echo "=== FIN DEL CHEQUEO ===\n";
