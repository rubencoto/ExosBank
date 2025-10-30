<?php
// Script para verificar estructura de tablas
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== VERIFICANDO ESTRUCTURA DE TABLAS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Verificar columnas de Usuarios
    echo "Columnas de tabla Usuarios:\n";
    $sqlUsuarios = "SELECT COLUMN_NAME, DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'Usuarios'
                    ORDER BY ORDINAL_POSITION";
    
    $stmtUsuarios = sqlsrv_query($conn, $sqlUsuarios);
    while ($col = sqlsrv_fetch_array($stmtUsuarios, SQLSRV_FETCH_ASSOC)) {
        echo "  - {$col['COLUMN_NAME']} ({$col['DATA_TYPE']})\n";
    }
    
    echo "\n";
    
    // Verificar columnas de Cuentas
    echo "Columnas de tabla Cuentas:\n";
    $sqlCuentas = "SELECT COLUMN_NAME, DATA_TYPE 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'Cuentas'
                   ORDER BY ORDINAL_POSITION";
    
    $stmtCuentas = sqlsrv_query($conn, $sqlCuentas);
    if ($stmtCuentas) {
        while ($col = sqlsrv_fetch_array($stmtCuentas, SQLSRV_FETCH_ASSOC)) {
            echo "  - {$col['COLUMN_NAME']} ({$col['DATA_TYPE']})\n";
        }
    } else {
        echo "  Tabla no existe o no se pudo consultar\n";
    }
    
    $database->closeConnection();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
