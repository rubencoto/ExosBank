<?php
// Cargar variables de entorno
require_once __DIR__ . '/config/env.php';

// Cargar configuración de base de datos
require_once __DIR__ . '/config/database.php';

// Ejemplo de uso
try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($conn) {
        echo "✅ Conexión exitosa a Azure SQL Database!<br>";
        echo "Servidor: " . DB_SERVER . "<br>";
        echo "Base de datos: " . DB_NAME . "<br>";
        
        // Cerrar conexión
        $database->closeConnection();
    }
} catch (Exception $e) {
    echo "❌ Error de conexión: " . $e->getMessage();
}
