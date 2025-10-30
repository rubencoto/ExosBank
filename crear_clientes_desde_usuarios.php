<?php
// Script para crear registros en tabla Clientes basados en Usuarios
// Ejecutar: php crear_clientes_desde_usuarios.php

require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== CREANDO CLIENTES DESDE USUARIOS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Obtener todos los usuarios que no tienen registro en Clientes
    $sqlUsuarios = "SELECT u.id_usuario, u.nombre, u.correo, u.cedula, u.direccion, u.telefono 
                    FROM dbo.Usuarios u
                    LEFT JOIN dbo.Clientes c ON u.id_usuario = c.id_usuario
                    WHERE c.id_cliente IS NULL";
    
    $stmtUsuarios = sqlsrv_query($conn, $sqlUsuarios);
    
    if (!$stmtUsuarios) {
        throw new Exception("Error al obtener usuarios: " . print_r(sqlsrv_errors(), true));
    }
    
    $usuariosSinCliente = [];
    while ($usuario = sqlsrv_fetch_array($stmtUsuarios, SQLSRV_FETCH_ASSOC)) {
        $usuariosSinCliente[] = $usuario;
    }
    
    if (count($usuariosSinCliente) == 0) {
        echo "Todos los usuarios ya tienen registro en Clientes\n\n";
    } else {
        echo "Encontrados " . count($usuariosSinCliente) . " usuarios sin registro en Clientes\n\n";
        
        foreach ($usuariosSinCliente as $usuario) {
            echo "Creando cliente: {$usuario['nombre']} ({$usuario['correo']})...\n";
            
            // Insertar en Clientes
            $sqlInsert = "INSERT INTO dbo.Clientes (id_usuario, cedula, direccion, telefono) 
                          VALUES (?, ?, ?, ?)";
            
            $params = array(
                $usuario['id_usuario'],
                $usuario['cedula'] ?? '',
                $usuario['direccion'] ?? '',
                $usuario['telefono'] ?? ''
            );
            
            $stmtInsert = sqlsrv_prepare($conn, $sqlInsert, $params);
            
            if (!$stmtInsert || !sqlsrv_execute($stmtInsert)) {
                echo "  Error al crear cliente: " . print_r(sqlsrv_errors(), true) . "\n";
                continue;
            }
            
            sqlsrv_free_stmt($stmtInsert);
            echo "  Cliente creado exitosamente\n\n";
        }
    }
    
    $database->closeConnection();
    
    echo "=== PROCESO COMPLETADO ===\n\n";
    echo "Ahora puedes ejecutar: php crear_tabla_cuentas.php\n\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
