<?php
// Script para verificar usuarios en la base de datos
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    // Consultar todos los usuarios
    $sql = "SELECT 
                u.id_usuario, 
                u.nombre, 
                u.correo, 
                u.rol, 
                u.cedula,
                u.telefono,
                u.direccion,
                c.id_cliente,
                COUNT(cu.id_cuenta) as num_cuentas
            FROM dbo.Usuarios u
            LEFT JOIN dbo.Clientes c ON u.id_usuario = c.id_usuario
            LEFT JOIN dbo.Cuentas cu ON c.id_cliente = cu.id_cliente
            GROUP BY u.id_usuario, u.nombre, u.correo, u.rol, u.cedula, u.telefono, u.direccion, c.id_cliente
            ORDER BY u.id_usuario DESC";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if (!$stmt) {
        throw new Exception('Error en la consulta: ' . print_r(sqlsrv_errors(), true));
    }
    
    echo "=== USUARIOS EN LA BASE DE DATOS ===\n\n";
    
    $count = 0;
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $count++;
        echo "Usuario #{$count}\n";
        echo "  ID Usuario: {$row['id_usuario']}\n";
        echo "  Nombre: {$row['nombre']}\n";
        echo "  Correo: {$row['correo']}\n";
        echo "  Rol: {$row['rol']}\n";
        echo "  Cédula: {$row['cedula']}\n";
        echo "  Teléfono: {$row['telefono']}\n";
        echo "  Dirección: {$row['direccion']}\n";
        echo "  ID Cliente: " . ($row['id_cliente'] ?? 'N/A') . "\n";
        echo "  Número de Cuentas: {$row['num_cuentas']}\n";
        echo "  ---\n";
    }
    
    echo "\nTotal de usuarios: $count\n\n";
    
    // Verificar últimos 5 usuarios creados
    $sqlRecent = "SELECT TOP 5 
                    u.nombre, 
                    u.correo, 
                    u.rol,
                    u.cedula
                  FROM dbo.Usuarios u
                  ORDER BY u.id_usuario DESC";
    
    $stmtRecent = sqlsrv_query($conn, $sqlRecent);
    
    echo "=== ÚLTIMOS 5 USUARIOS CREADOS ===\n\n";
    
    while ($row = sqlsrv_fetch_array($stmtRecent, SQLSRV_FETCH_ASSOC)) {
        echo "- {$row['nombre']} ({$row['correo']}) - {$row['rol']} - Cédula: {$row['cedula']}\n";
    }
    
    sqlsrv_free_stmt($stmt);
    sqlsrv_free_stmt($stmtRecent);
    $database->closeConnection();
    
    echo "\n✓ Verificación completada exitosamente\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
