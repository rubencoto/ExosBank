<?php
// Test de conexión a Azure SQL
echo "=== TEST DE CONEXIÓN A AZURE SQL ===\n\n";

// Cargar variables de entorno
require_once __DIR__ . '/config/env.php';

echo "Configuración cargada:\n";
echo "Servidor: " . getenv('DB_SERVER') . "\n";
echo "Base de datos: " . getenv('DB_NAME') . "\n";
echo "Usuario: " . getenv('DB_USER') . "\n";
echo "Contraseña: " . (getenv('DB_PASSWORD') ? '****' : 'NO DEFINIDA') . "\n\n";

// Intentar conexión directa
$serverName = "tcp:exos-cr.database.windows.net,1433";
$database = "exos_db";
$username = "exosadmin";
$password = "Admin2025**";

echo "Intentando conexión con:\n";
echo "Server: $serverName\n";
echo "Database: $database\n";
echo "User: $username\n\n";

$connectionInfo = array(
    "Database" => $database,
    "UID" => $username,
    "PWD" => $password,
    "CharacterSet" => "UTF-8",
    "Encrypt" => true,
    "TrustServerCertificate" => false,
    "LoginTimeout" => 30
);

echo "Conectando...\n";
$conn = sqlsrv_connect($serverName, $connectionInfo);

if ($conn === false) {
    echo "\n❌ ERROR DE CONEXIÓN:\n";
    $errors = sqlsrv_errors();
    foreach ($errors as $error) {
        echo "SQLSTATE: " . $error['SQLSTATE'] . "\n";
        echo "Código: " . $error['code'] . "\n";
        echo "Mensaje: " . $error['message'] . "\n\n";
    }
    die();
}

echo "✅ Conexión exitosa!\n\n";

// Probar una consulta simple
$sql = "SELECT DB_NAME() AS CurrentDatabase, GETDATE() AS CurrentDateTime, SYSTEM_USER AS CurrentUser";
$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    echo "❌ Error en la consulta:\n";
    print_r(sqlsrv_errors());
} else {
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    echo "Información de la conexión:\n";
    echo "Base de datos actual: " . $row['CurrentDatabase'] . "\n";
    echo "Fecha/hora del servidor: " . $row['CurrentDateTime']->format('Y-m-d H:i:s') . "\n";
    echo "Usuario actual: " . $row['CurrentUser'] . "\n\n";
    sqlsrv_free_stmt($stmt);
}

// Verificar tablas
echo "Verificando estructura de la base de datos...\n";
$sqlTables = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME";
$stmtTables = sqlsrv_query($conn, $sqlTables);

if ($stmtTables === false) {
    echo "❌ Error al listar tablas:\n";
    print_r(sqlsrv_errors());
} else {
    echo "\nTablas encontradas:\n";
    while ($row = sqlsrv_fetch_array($stmtTables, SQLSRV_FETCH_ASSOC)) {
        echo "  - " . $row['TABLE_NAME'] . "\n";
    }
    sqlsrv_free_stmt($stmtTables);
}

// Contar usuarios
$sqlCount = "SELECT COUNT(*) as total FROM dbo.Usuarios";
$stmtCount = sqlsrv_query($conn, $sqlCount);

if ($stmtCount === false) {
    echo "\n❌ Error al contar usuarios:\n";
    print_r(sqlsrv_errors());
} else {
    $row = sqlsrv_fetch_array($stmtCount, SQLSRV_FETCH_ASSOC);
    echo "\nTotal de usuarios registrados: " . $row['total'] . "\n";
    sqlsrv_free_stmt($stmtCount);
}

sqlsrv_close($conn);
echo "\n✅ Test completado exitosamente!\n";
