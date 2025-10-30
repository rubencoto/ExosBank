<?php
// Script para agregar columnas a tabla Usuarios
// Ejecutar: php actualizar_tabla_usuarios.php

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== ACTUALIZANDO ESTRUCTURA DE TABLA USUARIOS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Columnas a agregar
    $columnas = [
        [
            'nombre' => 'cedula',
            'sql' => "ALTER TABLE dbo.Usuarios ADD cedula NVARCHAR(20) NULL"
        ],
        [
            'nombre' => 'direccion',
            'sql' => "ALTER TABLE dbo.Usuarios ADD direccion NVARCHAR(255) NULL"
        ],
        [
            'nombre' => 'telefono',
            'sql' => "ALTER TABLE dbo.Usuarios ADD telefono NVARCHAR(20) NULL"
        ],
        [
            'nombre' => 'tipo_cuenta',
            'sql' => "ALTER TABLE dbo.Usuarios ADD tipo_cuenta NVARCHAR(1) NULL DEFAULT '1'"
        ]
    ];
    
    foreach ($columnas as $columna) {
        echo "Agregando columna: {$columna['nombre']}... ";
        
        // Verificar si existe
        $sqlCheck = "SELECT COUNT(*) as count 
                     FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'Usuarios' 
                     AND COLUMN_NAME = '{$columna['nombre']}'";
        
        $stmtCheck = sqlsrv_query($conn, $sqlCheck);
        
        if (!$stmtCheck) {
            echo "Error al verificar: " . print_r(sqlsrv_errors(), true) . "\n";
            continue;
        }
        
        $row = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);
        
        if ($row['count'] > 0) {
            echo "Ya existe\n";
            sqlsrv_free_stmt($stmtCheck);
            continue;
        }
        
        sqlsrv_free_stmt($stmtCheck);
        
        // Agregar columna
        $stmtAlter = sqlsrv_query($conn, $columna['sql']);
        
        if (!$stmtAlter) {
            echo "Error: " . print_r(sqlsrv_errors(), true) . "\n";
            continue;
        }
        
        sqlsrv_free_stmt($stmtAlter);
        echo "Agregada exitosamente\n";
    }
    
    $database->closeConnection();
    
    echo "\n=== PROCESO COMPLETADO ===\n\n";
    
    echo "Columnas agregadas:\n";
    echo "  cedula (NVARCHAR(20))\n";
    echo "  direccion (NVARCHAR(255))\n";
    echo "  telefono (NVARCHAR(20))\n";
    echo "  tipo_cuenta (NVARCHAR(1), default '1')\n\n";
    
    echo "Ahora puedes ejecutar: php crear_usuarios_prueba.php\n\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
