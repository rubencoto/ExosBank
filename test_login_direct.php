<?php
// Simular un POST request al login.php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:3002';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// Simular input JSON
$GLOBALS['mock_input'] = json_encode([
    'email' => 'morita@gmail.com',
    'password' => '123456'
]);

// Override file_get_contents para php://input
eval('
function file_get_contents($filename, ...$args) {
    if ($filename === "php://input") {
        return $GLOBALS["mock_input"];
    }
    return \file_get_contents($filename, ...$args);
}
');

// Capturar output
ob_start();
include 'api/login.php';
$output = ob_get_clean();

echo "=== RESULTADO DEL LOGIN ===\n";
echo $output . "\n";

// Mostrar sesión
echo "\n=== ESTADO DE SESIÓN ===\n";
if (isset($_SESSION)) {
    foreach ($_SESSION as $key => $value) {
        echo "$key: $value\n";
    }
} else {
    echo "Sesión no iniciada\n";
}
?>
