<?php
// Script para verificar estructura de tabla Clientes
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== ESTRUCTURA DE TABLA CLIENTES ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $sql = "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Clientes'
            ORDER BY ORDINAL_POSITION";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt) {
        while ($col = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $length = $col['CHARACTER_MAXIMUM_LENGTH'] ? "({$col['CHARACTER_MAXIMUM_LENGTH']})" : "";
            $nullable = $col['IS_NULLABLE'] == 'YES' ? 'NULL' : 'NOT NULL';
            echo "  {$col['COLUMN_NAME']} {$col['DATA_TYPE']}{$length} $nullable\n";
        }
    }
    
    $database->closeConnection();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
