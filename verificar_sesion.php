<?php
/**
 * Script para verificar el estado de la sesión
 */

require_once __DIR__ . '/config/session.php';
session_start();

echo "=== VERIFICACIÓN DE SESIÓN ===\n\n";

echo "Session ID: " . session_id() . "\n";
echo "Estado: " . (session_status() === PHP_SESSION_ACTIVE ? "✓ Activa" : "✗ Inactiva") . "\n\n";

echo "Variables de sesión:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

if (empty($_SESSION)) {
    echo "⚠️  No hay variables de sesión guardadas\n";
} else {
    foreach ($_SESSION as $key => $value) {
        echo sprintf("%-20s: %s\n", $key, is_array($value) ? json_encode($value) : $value);
    }
}

echo "\n";

// Verificar si la sesión tiene los datos correctos
$requeridos = ['usuario_id', 'nombre', 'correo', 'rol'];
$faltantes = [];

foreach ($requeridos as $campo) {
    if (!isset($_SESSION[$campo])) {
        $faltantes[] = $campo;
    }
}

if (empty($faltantes)) {
    echo "✓ Todos los campos requeridos están presentes\n";
} else {
    echo "⚠️  Campos faltantes: " . implode(', ', $faltantes) . "\n";
    echo "\n💡 Cierra sesión y vuelve a iniciar sesión\n";
}
