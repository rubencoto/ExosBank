<?php
// Script para verificar usuarios con cuentas
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/database.php';

echo "=== VERIFICANDO USUARIOS Y CUENTAS ===\n\n";

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $sql = "SELECT 
                u.id_usuario,
                u.nombre,
                u.correo,
                u.cedula,
                u.direccion,
                u.telefono,
                u.tipo_cuenta,
                c.id_cliente,
                cu.id_cuenta,
                cu.numero_cuenta,
                cu.tipo_cuenta as tipo_cuenta_bancaria,
                cu.saldo
            FROM dbo.Usuarios u
            LEFT JOIN dbo.Clientes c ON u.id_usuario = c.id_usuario
            LEFT JOIN dbo.Cuentas cu ON c.id_cliente = cu.id_cliente
            WHERE u.rol = 'Cliente'
            ORDER BY u.id_usuario";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if (!$stmt) {
        throw new Exception("Error: " . print_r(sqlsrv_errors(), true));
    }
    
    echo "Usuario | Email | Cliente ID | Cuenta ID | Número de Cuenta | Saldo\n";
    echo str_repeat("-", 100) . "\n";
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        printf(
            "%s | %s | %s | %s | %s | ₡%.2f\n",
            $row['nombre'],
            $row['correo'],
            $row['id_cliente'] ?? 'NULL',
            $row['id_cuenta'] ?? 'NULL',
            $row['numero_cuenta'] ?? 'NULL',
            $row['saldo'] ?? 0.00
        );
    }
    
    $database->closeConnection();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
